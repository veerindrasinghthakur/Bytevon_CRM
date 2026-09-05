"""
LeavePublicService — only public entry point for Leave.

Owns local status projection on leave_requests.
Integrates with Approvals:
  - Submit: create leave_request + ApprovalPublicService.create_request in one TX.
  - Decision: handles post-commit event from Approvals; updates local status + ledger.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
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
from app.modules.leave.models import LeaveLedger, LeavePolicy, LeaveRequest
from app.modules.leave.repositories.repository import LeaveRepository
from app.modules.leave.schemas.schemas import (
    ApplyLeaveBalanceItem,
    ApplyLeaveContextResponse,
    HolidayItem,
    LeaveBalanceItem,
    LeaveBalanceResponse,
    LeaveCalculateRequest,
    LeaveCalculateResponse,
    LeaveLedgerCreate,
    LeaveLedgerResponse,
    LeavePolicyCreate,
    LeavePolicyResponse,
    LeaveRequestCreate,
    LeaveRequestResponse,
    LeaveTypeOptionItem,
    MessageResponse,
)

logger = logging.getLogger(__name__)

LEAVE_REQUEST_TYPE = "LEAVE_REQUEST"


def _calendar_days(start: date, end: date) -> Decimal:
    """Inclusive calendar-day count (fallback when working-day rules unavailable)."""
    return Decimal((end - start).days + 1)


def _working_days(
    start: date,
    end: date,
    *,
    holiday_dates: set[date],
    half_day: bool = False,
) -> Decimal:
    """
    Inclusive working-day count excluding weekends (Sat/Sun) and holidays.
    Half-day subtracts 0.5 when at least one working day is in range.
    """
    if end < start:
        return Decimal("0")
    days = 0
    cur = start
    while cur <= end:
        if cur.weekday() < 5 and cur not in holiday_dates:
            days += 1
        cur += timedelta(days=1)
    if half_day and days >= 1:
        return max(Decimal("0.5"), Decimal(days) - Decimal("0.5"))
    return Decimal(days)


class LeavePublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = LeaveRepository(session)
        self._approvals = ApprovalPublicService(session)

    # ==================================================================
    # Policies (versioned)
    # ==================================================================

    async def create_policy(
        self,
        data: LeavePolicyCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> LeavePolicyResponse:
        current = await self._repo.get_current_policy(
            data.leave_type, as_of=data.effective_from
        )
        if current and current.effective_to is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_policy(current.id, close_to)

        policy = LeavePolicy(
            name=data.name,
            leave_type=data.leave_type,
            annual_entitlement=data.annual_entitlement,
            carry_forward_limit=data.carry_forward_limit,
            effective_from=data.effective_from,
            effective_to=None,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(policy)
        await self._commit()
        await self._audit("leave_policy.created", policy.id, actor_employment_id)
        return LeavePolicyResponse.model_validate(policy)

    async def list_policies(
        self, *, leave_type: Optional[LeaveType] = None
    ) -> list[LeavePolicyResponse]:
        rows = await self._repo.list_policies(leave_type=leave_type)
        return [LeavePolicyResponse.model_validate(r) for r in rows]

    async def get_current_policy(
        self, leave_type: LeaveType, *, as_of: Optional[date] = None
    ) -> LeavePolicyResponse:
        policy = await self._repo.get_current_policy(leave_type, as_of=as_of)
        if policy is None:
            raise NotFoundError(f"No effective policy for {leave_type.value}")
        return LeavePolicyResponse.model_validate(policy)

    # ==================================================================
    # Submit leave request (consumer TX owns approval create)
    # ==================================================================

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

        # Balance check (LOSS_OF_PAY can go negative conceptually; skip hard block)
        if data.leave_type != LeaveType.LOSS_OF_PAY:
            balance = await self._repo.sum_balance(
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
        await self._flush()  # need leave_req.id

        # Create approval request inside same TX (commit=False)
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
            # Allow system / admin later via RBAC; for now requester only
            raise DomainError("Only the requester can cancel this leave request")

        req.status = LeaveRequestStatus.CANCELLED
        await self._commit()

        # Also cancel the linked approval if present
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

    # ==================================================================
    # Approval decision handler (called after Approvals commit)
    # ==================================================================

    async def handle_approval_decision(self, event: dict) -> None:
        """
        Registered via register_approval_decision_handler.
        Runs in its own TX: update local status + ledger on APPROVED.
        """
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
                return  # idempotent
            req.status = LeaveRequestStatus.APPROVED
            days = req.days or _calendar_days(req.start_date, req.end_date)
            # Consume balance
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

    # ==================================================================
    # Ledger / balance
    # ==================================================================

    async def post_ledger_entry(
        self,
        data: LeaveLedgerCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> LeaveLedgerResponse:
        entry = LeaveLedger(
            employment_id=data.employment_id,
            leave_type=data.leave_type,
            transaction_type=data.transaction_type,
            days=data.days,
            reference_type=data.reference_type,
            reference_id=data.reference_id,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(entry)
        await self._commit()
        await self._audit("leave_ledger.posted", entry.id, actor_employment_id)
        return LeaveLedgerResponse.model_validate(entry)

    async def list_ledger(
        self,
        employment_id: int,
        *,
        leave_type: Optional[LeaveType] = None,
        limit: int = 200,
    ) -> list[LeaveLedgerResponse]:
        rows = await self._repo.list_ledger(
            employment_id, leave_type=leave_type, limit=limit
        )
        return [LeaveLedgerResponse.model_validate(r) for r in rows]

    async def get_balances(self, employment_id: int) -> LeaveBalanceResponse:
        rows = await self._repo.sum_balances_by_type(employment_id)
        balances = [
            LeaveBalanceItem(
                leave_type=lt,
                balance_days=Decimal(str(total)),
            )
            for lt, total in rows
        ]
        # Ensure all known types appear (zero if missing)
        present = {b.leave_type for b in balances}
        for lt in LeaveType:
            if lt not in present:
                balances.append(LeaveBalanceItem(leave_type=lt, balance_days=Decimal("0")))
        balances.sort(key=lambda b: b.leave_type.value)
        return LeaveBalanceResponse(employment_id=employment_id, balances=balances)

    # ==================================================================
    # Apply Leave page — context + working-day calculation
    # ==================================================================

    async def _load_holidays(
        self,
        *,
        calendar_id: Optional[int] = None,
        year: Optional[int] = None,
    ) -> list[HolidayItem]:
        """Load holidays via Organization public service (no direct table access)."""
        from app.modules.organization.services.public_service import OrganizationPublicService

        org = OrganizationPublicService(self._session)
        items: list[HolidayItem] = []
        if calendar_id is not None:
            rows = await org.list_holidays(calendar_id)
            for h in rows:
                if year is not None and h.date.year != year:
                    continue
                items.append(
                    HolidayItem(
                        date=h.date,
                        name=h.name,
                        holiday_type=h.holiday_type.value
                        if hasattr(h.holiday_type, "value")
                        else str(h.holiday_type),
                    )
                )
            return items

        calendars = await org.list_holiday_calendars(include_archived=False)
        for cal in calendars:
            rows = await org.list_holidays(cal.id)
            for h in rows:
                if year is not None and h.date.year != year:
                    continue
                items.append(
                    HolidayItem(
                        date=h.date,
                        name=h.name,
                        holiday_type=h.holiday_type.value
                        if hasattr(h.holiday_type, "value")
                        else str(h.holiday_type),
                    )
                )
        # Dedupe by date (prefer first calendar)
        seen: set[date] = set()
        unique: list[HolidayItem] = []
        for h in sorted(items, key=lambda x: x.date):
            if h.date in seen:
                continue
            seen.add(h.date)
            unique.append(h)
        return unique

    async def get_apply_context(
        self,
        employment_id: int,
        *,
        holiday_calendar_id: Optional[int] = None,
        year: Optional[int] = None,
    ) -> ApplyLeaveContextResponse:
        """
        Bootstrap payload for Apply Leave: holidays, leave type options, balances.
        Frontend should treat these as authoritative (no local holiday hardcoding).
        """
        as_of = date.today()
        y = year or as_of.year
        holidays = await self._load_holidays(calendar_id=holiday_calendar_id, year=y)

        # Type options from current policies
        leave_types: list[LeaveTypeOptionItem] = []
        for lt in LeaveType:
            try:
                policy = await self.get_current_policy(lt, as_of=as_of)
                leave_types.append(
                    LeaveTypeOptionItem(
                        leave_type=lt,
                        name=policy.name,
                        annual_entitlement=policy.annual_entitlement,
                        description=None,
                    )
                )
            except NotFoundError:
                # Still expose the enum value with zero entitlement so UI can list it
                leave_types.append(
                    LeaveTypeOptionItem(
                        leave_type=lt,
                        name=lt.value.replace("_", " ").title(),
                        annual_entitlement=Decimal("0"),
                        description=None,
                    )
                )

        balance_resp = await self.get_balances(employment_id)
        # Map ledger remaining → used/total using policy entitlement when available
        balances: list[ApplyLeaveBalanceItem] = []
        entitlement_by_type = {t.leave_type: t.annual_entitlement for t in leave_types}
        for b in balance_resp.balances:
            total = entitlement_by_type.get(b.leave_type, Decimal("0"))
            remaining = b.balance_days
            # If ledger is the source of truth for remaining, derive used from entitlement
            used = max(Decimal("0"), total - remaining) if total > 0 else Decimal("0")
            balances.append(
                ApplyLeaveBalanceItem(
                    leave_type=b.leave_type,
                    used=used,
                    total=total,
                    remaining=remaining,
                )
            )

        return ApplyLeaveContextResponse(
            employment_id=employment_id,
            holidays=holidays,
            leave_types=leave_types,
            balances=balances,
        )

    async def calculate_leave_days(
        self, data: LeaveCalculateRequest
    ) -> LeaveCalculateResponse:
        """Working-day cost + projected balance for the selected range."""
        holidays = await self._load_holidays(calendar_id=data.holiday_calendar_id)
        holiday_dates = {h.date for h in holidays}
        in_range = [
            h
            for h in holidays
            if data.start_date <= h.date <= data.end_date
        ]
        day_cost = _working_days(
            data.start_date,
            data.end_date,
            holiday_dates=holiday_dates,
            half_day=data.half_day,
        )

        balance_remaining: Optional[Decimal] = None
        estimated_after: Optional[Decimal] = None
        if data.leave_type != LeaveType.LOSS_OF_PAY:
            balance_remaining = await self._repo.sum_balance(
                data.employment_id, data.leave_type
            )
            estimated_after = max(Decimal("0"), balance_remaining - day_cost)

        return LeaveCalculateResponse(
            day_cost=day_cost,
            balance_remaining=balance_remaining,
            estimated_balance_after=estimated_after,
            holidays_in_range=in_range,
        )

    # ==================================================================
    # Helpers
    # ==================================================================

