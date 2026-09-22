"""RequestService — leave requests + approval decision handler."""
from __future__ import annotations

import logging
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import (
    ApprovalStatus,
    ApprovalTarget,
    LeaveLedgerTransactionType,
    LeaveRequestStatus,
    LeaveType,
)
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.approvals.approval_action.schemas import ApprovalActionRequest
from app.modules.approvals.approval_action.service import ApprovalActionService
from app.modules.approvals.request.schemas import ApprovalRequestCreate
from app.modules.approvals.request.service import RequestService as ApprovalPublicService
from app.modules.leave.ledger.repository import LedgerRepository
from app.modules.leave.models import LeaveLedger, LeaveRequest
from app.modules.leave.request.repository import RequestRepository
from app.modules.leave.request.schemas import LeaveRequestCreate, LeaveRequestResponse

logger = logging.getLogger(__name__)

LEAVE_REQUEST_TYPE = "LEAVE_REQUEST"
LEAVE_CANCEL_TYPE = "LEAVE_CANCEL"


async def _canonical_days(session, start: date, end: date) -> Decimal:
    """Q13 canonical day cost (working days minus holidays)."""
    from app.modules.leave.leave_days import canonical_leave_days

    return await canonical_leave_days(session, start, end)


class RequestService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = RequestRepository(session)
        self._ledger_repo = LedgerRepository(session)
        self._approvals = ApprovalPublicService(session)
        self._approval_actions = ApprovalActionService(session)

    async def submit_request(
        self,
        data: LeaveRequestCreate,
        *,
        actor_employment_id: int | None = None,
    ) -> LeaveRequestResponse:
        if data.end_date < data.start_date:
            raise DomainError("end_date must be on or after start_date")

        overlap = await self._repo.has_overlapping_request(
            data.employment_id, data.start_date, data.end_date
        )
        if overlap:
            raise ConflictError(
                "Overlapping pending/approved leave request already exists"
            )

        # Q13: canonical working-day cost (same function as preview).
        days = await _canonical_days(
            self._session, data.start_date, data.end_date
        )
        if days <= 0:
            raise DomainError(
                "Leave range contains no working days (weekends/holidays only)"
            )

        if data.leave_type != LeaveType.LOSS_OF_PAY:
            balance = await self._ledger_repo.sum_balance(
                data.employment_id, data.leave_type
            )
            if balance < days:
                raise DomainError(
                    f"Insufficient balance for {data.leave_type.value}: "
                    f"have {balance}, need {days}"
                )

        actor = actor_employment_id or data.employment_id

        leave_req = LeaveRequest(
            employment_id=data.employment_id,
            leave_type=data.leave_type,
            start_date=data.start_date,
            end_date=data.end_date,
            reason=data.reason,
            status=LeaveRequestStatus.PENDING,
            days=days,
        )
        await self._repo.add(leave_req)
        await self._flush()

        # Q13: reserve the balance with an immutable HOLD row (no LOSS_OF_PAY).
        # The hold is released on reject/cancel and converted on approval.
        if data.leave_type != LeaveType.LOSS_OF_PAY:
            await self._repo.add(
                LeaveLedger(
                    employment_id=data.employment_id,
                    leave_type=data.leave_type,
                    transaction_type=LeaveLedgerTransactionType.HOLD.value,
                    days=-abs(days),
                    reference_type=LEAVE_REQUEST_TYPE,
                    reference_id=leave_req.id,
                    changed_by=actor,
                )
            )
            await self._flush()

        approval = await self._approvals.create_request(
            ApprovalRequestCreate(
                request_type=LEAVE_REQUEST_TYPE,
                reference_id=leave_req.id,
                requester_employment_id=data.employment_id,
                target=ApprovalTarget.DEPARTMENT_HEAD,
                target_department_id=await self._resolve_target_department(
                    data.employment_id,
                    explicit=data.target_department_id,
                ),
            ),
            actor_employment_id=actor,
            commit=False,
        )
        leave_req.approval_request_id = approval.id

        await self._commit()
        # The approval_request_id assignment issues an UPDATE on commit, which
        # postfetch-expires server-computed columns (updated_at); refresh before
        # sync validation to avoid MissingGreenlet.
        await self._refresh(leave_req)
        await self._audit("leave_request.submitted", leave_req.id, actor)
        await self._notify(
            employment_id=data.employment_id,
            title="Leave request submitted",
            body=(
                f"{data.leave_type.value} leave {data.start_date.isoformat()} → "
                f"{data.end_date.isoformat()} ({days} day(s)) is pending approval."
            ),
        )
        return LeaveRequestResponse.model_validate(leave_req)

    async def _resolve_target_department(
        self, employment_id: int, *, explicit: int | None = None
    ) -> int | None:
        """Q10: approver resolution from the manager hierarchy.

        The requester's current department determines the approving manager
        (department head). An explicit caller-supplied department wins when
        given; existing pending approvals keep their stored target.
        """
        if explicit is not None:
            return explicit
        try:
            from app.modules.workforce.employee.repository import (
                EmployeeRepository,
            )

            repo = EmployeeRepository(self._session)
            asg = await repo.get_current_assignment(employment_id)
            if asg is not None and asg.department_id is not None:
                return int(asg.department_id)
        except Exception:
            logger.exception(
                "Failed to resolve target department for employment %s",
                employment_id,
            )
        return None

    async def _release_hold(
        self, employment_id: int, leave_type: LeaveType, reference_id: int, *, actor: int
    ) -> None:
        """Release an outstanding HOLD debit for a request (idempotent).

        Only releases what is actually held (legacy rows without HOLD are
        untouched). The ledger stays append-only: release is a +HOLD row.
        """
        from sqlalchemy import func, select

        if leave_type == LeaveType.LOSS_OF_PAY:
            return
        stmt = select(func.coalesce(func.sum(LeaveLedger.days), 0)).where(
            LeaveLedger.employment_id == employment_id,
            LeaveLedger.leave_type == leave_type,
            LeaveLedger.transaction_type == LeaveLedgerTransactionType.HOLD.value,
            LeaveLedger.reference_type == LEAVE_REQUEST_TYPE,
            LeaveLedger.reference_id == reference_id,
        )
        held = Decimal(str((await self._session.execute(stmt)).scalar() or 0))
        if held < 0:
            await self._repo.add(
                LeaveLedger(
                    employment_id=employment_id,
                    leave_type=leave_type,
                    transaction_type=LeaveLedgerTransactionType.HOLD.value,
                    days=abs(held),
                    reference_type=LEAVE_REQUEST_TYPE,
                    reference_id=reference_id,
                    changed_by=actor,
                )
            )

    async def get_request(self, request_id: int) -> LeaveRequestResponse:
        req = await self._repo.get_request_by_id(request_id)
        if req is None:
            raise NotFoundError("Leave request not found")
        return LeaveRequestResponse.model_validate(req)

    async def list_requests(
        self,
        *,
        employment_id: int | None = None,
        status: LeaveRequestStatus | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[LeaveRequestResponse]:
        rows = await self._repo.list_requests(
            employment_id=employment_id,
            status=status,
            limit=limit,
            offset=offset,
        )
        return [LeaveRequestResponse.model_validate(r) for r in rows]

    async def cancel_request(
        self,
        request_id: int,
        *,
        actor_employment_id: int,
    ) -> LeaveRequestResponse:
        req = await self._repo.get_request_by_id(request_id)
        if req is None:
            raise NotFoundError("Leave request not found")
        if req.status != LeaveRequestStatus.PENDING:
            raise DomainError("Only pending leave requests can be cancelled")
        if req.employment_id != actor_employment_id:
            raise DomainError("Only the requester can cancel this leave request")

        req.status = LeaveRequestStatus.CANCELLED
        # Q13: release the reservation; ledger stays append-only.
        await self._release_hold(
            req.employment_id, req.leave_type, req.id, actor=actor_employment_id
        )
        await self._commit()
        # UPDATE postfetch-expires server-computed columns; refresh before validation.
        await self._refresh(req)

        if req.approval_request_id:
            try:
                await self._approval_actions.cancel(
                    req.approval_request_id,
                    ApprovalActionRequest(remarks="Leave request cancelled by requester"),
                    actor_employment_id=actor_employment_id,
                )
            except Exception:
                logger.exception(
                    "Failed to cancel linked approval %s", req.approval_request_id
                )

        await self._audit("leave_request.cancelled", req.id, actor_employment_id)
        return LeaveRequestResponse.model_validate(req)

    async def request_approved_cancel(
        self, request_id: int, *, actor_employment_id: int
    ):
        """Q5: request cancellation of APPROVED future leave.

        Creates a LEAVE_CANCEL approval; on approval the leave becomes
        CANCELLED with a REVERSAL ledger row. The original CONSUMPTION row is
        never modified or deleted.
        """
        from datetime import date as _date


        req = await self._repo.get_request_by_id(request_id)
        if req is None:
            raise NotFoundError("Leave request not found")
        if req.status != LeaveRequestStatus.APPROVED:
            raise DomainError("Only approved leave can be cancelled this way")
        if req.employment_id != actor_employment_id:
            raise DomainError("Only the requester can request cancellation")
        if req.end_date < _date.today():
            raise DomainError("Past leave cannot be cancelled")
        try:
            existing = await self._approvals.get_request_by_reference(
                LEAVE_CANCEL_TYPE, req.id
            )
        except NotFoundError:
            existing = None
        if existing is not None and existing.status == ApprovalStatus.PENDING:
            raise ConflictError(
                "A pending cancellation request already exists for this leave"
            )
        approval = await self._approvals.create_request(
            ApprovalRequestCreate(
                request_type=LEAVE_CANCEL_TYPE,
                reference_id=req.id,
                requester_employment_id=actor_employment_id,
                target=ApprovalTarget.DEPARTMENT_HEAD,
                target_department_id=await self._resolve_target_department(
                    req.employment_id
                ),
            ),
            actor_employment_id=actor_employment_id,
        )
        await self._audit("leave_request.cancel_requested", req.id, actor_employment_id)
        return approval

    async def handle_approval_decision(self, event: dict) -> None:
        if event.get("request_type") not in (LEAVE_REQUEST_TYPE, LEAVE_CANCEL_TYPE):
            return

        status_str = event.get("status")
        reference_id = event.get("reference_id")
        actor = event.get("actor_employment_id") or settings.SYSTEM_EMPLOYMENT_ID

        if status_str is None or reference_id is None:
            logger.warning("Leave approval event missing status/reference: %s", event)
            return
        req = await self._repo.get_request_by_id(int(reference_id))
        if req is None:
            logger.warning("Leave request %s not found for approval event", reference_id)
            return

        if event.get("request_type") == LEAVE_CANCEL_TYPE:
            await self._handle_cancel_decision(req, status_str, actor=actor)
            return

        if status_str == ApprovalStatus.APPROVED.value:
            if req.status == LeaveRequestStatus.APPROVED:
                return
            req.status = LeaveRequestStatus.APPROVED
            days = req.days or await _canonical_days(
                self._session, req.start_date, req.end_date
            )
            if req.leave_type != LeaveType.LOSS_OF_PAY:
                # Q13: convert HOLD → CONSUMPTION (release + consume).
                await self._release_hold(
                    req.employment_id, req.leave_type, req.id, actor=actor
                )
                ledger = LeaveLedger(
                    employment_id=req.employment_id,
                    leave_type=req.leave_type,
                    transaction_type=LeaveLedgerTransactionType.CONSUMPTION.value,
                    days=-abs(days),
                    reference_type=LEAVE_REQUEST_TYPE,
                    reference_id=req.id,
                    changed_by=actor,
                )
                await self._repo.add(ledger)
            await self._commit()
            await self._audit("leave_request.approved", req.id, actor)
            await self._notify(
                employment_id=req.employment_id,
                title="Leave approved",
                body=f"Leave request #{req.id} ({req.leave_type.value}) was approved.",
            )

        elif status_str == ApprovalStatus.REJECTED.value:
            if req.status == LeaveRequestStatus.REJECTED:
                return
            req.status = LeaveRequestStatus.REJECTED
            await self._release_hold(
                req.employment_id, req.leave_type, req.id, actor=actor
            )
            await self._commit()
            await self._audit("leave_request.rejected", req.id, actor)
            await self._notify(
                employment_id=req.employment_id,
                title="Leave rejected",
                body=f"Leave request #{req.id} ({req.leave_type.value}) was rejected.",
            )

        elif status_str == ApprovalStatus.CANCELLED.value:
            if req.status == LeaveRequestStatus.CANCELLED:
                return
            req.status = LeaveRequestStatus.CANCELLED
            await self._release_hold(
                req.employment_id, req.leave_type, req.id, actor=actor
            )
            await self._commit()
            await self._audit("leave_request.cancelled_via_approval", req.id, actor)

    async def _handle_cancel_decision(self, req: LeaveRequest, status_str: str, *, actor: int) -> None:
        """Q5: decision on a LEAVE_CANCEL approval (leave must be APPROVED)."""
        if status_str == ApprovalStatus.APPROVED.value:
            if req.status != LeaveRequestStatus.APPROVED:
                return
            req.status = LeaveRequestStatus.CANCELLED
            days = req.days or await _canonical_days(
                self._session, req.start_date, req.end_date
            )
            if req.leave_type != LeaveType.LOSS_OF_PAY:
                reversal = LeaveLedger(
                    employment_id=req.employment_id,
                    leave_type=req.leave_type,
                    transaction_type=LeaveLedgerTransactionType.REVERSAL.value,
                    days=abs(days),
                    reference_type=LEAVE_CANCEL_TYPE,
                    reference_id=req.id,
                    changed_by=actor,
                )
                await self._repo.add(reversal)
            await self._commit()
            await self._audit("leave_request.cancel_approved", req.id, actor)
            await self._notify(
                employment_id=req.employment_id,
                title="Leave cancellation approved",
                body=f"Approved leave #{req.id} was cancelled; balance restored.",
            )
        elif status_str == ApprovalStatus.REJECTED.value:
            await self._audit("leave_request.cancel_rejected", req.id, actor)
            await self._notify(
                employment_id=req.employment_id,
                title="Leave cancellation rejected",
                body=f"Cancellation of leave #{req.id} was rejected; leave stays approved.",
            )
        elif status_str == ApprovalStatus.CANCELLED.value:
            await self._audit("leave_request.cancel_withdrawn", req.id, actor)
