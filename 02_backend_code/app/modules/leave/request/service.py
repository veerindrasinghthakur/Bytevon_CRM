"""RequestService — leave requests + approval decision handler."""
from __future__ import annotations

import logging
from datetime import date
from decimal import Decimal
from typing import Optional

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
from app.modules.approvals.schemas.schemas import ApprovalRequestCreate
from app.modules.approvals.services.public_service import ApprovalPublicService
from app.modules.leave.models import LeaveLedger, LeaveRequest
from app.modules.leave.request.repository import RequestRepository
from app.modules.leave.request.schemas import LeaveRequestCreate, LeaveRequestResponse
from app.modules.leave.ledger.repository import LedgerRepository

logger = logging.getLogger(__name__)

LEAVE_REQUEST_TYPE = "LEAVE_REQUEST"


def _calendar_days(start: date, end: date) -> Decimal:
    return Decimal((end - start).days + 1)


class RequestService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = RequestRepository(session)
        self._ledger_repo = LedgerRepository(session)
        self._approvals = ApprovalPublicService(session)

    async def submit_request(
        self,
        data: LeaveRequestCreate,
        *,
        actor_employment_id: Optional[int] = None,
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

        days = _calendar_days(data.start_date, data.end_date)

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

        approval = await self._approvals.create_request(
            ApprovalRequestCreate(
                request_type=LEAVE_REQUEST_TYPE,
                reference_id=leave_req.id,
                requester_employment_id=data.employment_id,
                target=ApprovalTarget.DEPARTMENT_HEAD,
                target_department_id=data.target_department_id,
            ),
            actor_employment_id=actor,
            commit=False,
        )
        leave_req.approval_request_id = approval.id

        await self._commit()
        await self._audit("leave_request.submitted", leave_req.id, actor)
        return LeaveRequestResponse.model_validate(leave_req)

    async def get_request(self, request_id: int) -> LeaveRequestResponse:
        req = await self._repo.get_request_by_id(request_id)
        if req is None:
            raise NotFoundError("Leave request not found")
        return LeaveRequestResponse.model_validate(req)

    async def list_requests(
        self,
        *,
        employment_id: Optional[int] = None,
        status: Optional[LeaveRequestStatus] = None,
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
        await self._commit()

        if req.approval_request_id:
            try:
                from app.modules.approvals.schemas.schemas import ApprovalActionRequest

                await self._approvals.cancel(
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

    async def handle_approval_decision(self, event: dict) -> None:
        if event.get("request_type") != LEAVE_REQUEST_TYPE:
            return

        status_str = event.get("status")
        reference_id = event.get("reference_id")
        actor = event.get("actor_employment_id") or settings.SYSTEM_EMPLOYMENT_ID

        req = await self._repo.get_request_by_id(int(reference_id))
        if req is None:
            logger.warning("Leave request %s not found for approval event", reference_id)
            return

        if status_str == ApprovalStatus.APPROVED.value:
            if req.status == LeaveRequestStatus.APPROVED:
                return
            req.status = LeaveRequestStatus.APPROVED
            days = req.days or _calendar_days(req.start_date, req.end_date)
            if req.leave_type != LeaveType.LOSS_OF_PAY:
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

        elif status_str == ApprovalStatus.REJECTED.value:
            if req.status == LeaveRequestStatus.REJECTED:
                return
            req.status = LeaveRequestStatus.REJECTED
            await self._commit()
            await self._audit("leave_request.rejected", req.id, actor)

        elif status_str == ApprovalStatus.CANCELLED.value:
            if req.status == LeaveRequestStatus.CANCELLED:
                return
            req.status = LeaveRequestStatus.CANCELLED
            await self._commit()
            await self._audit("leave_request.cancelled_via_approval", req.id, actor)
