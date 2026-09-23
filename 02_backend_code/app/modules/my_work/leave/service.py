"""My Work Leave Service — self-service facade over the leave domain (Q14).

No business logic lives here: every operation delegates to the canonical
leave RequestService / LedgerService so validation, HOLD accounting, and
the approval workflow are identical to the HR/admin paths.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import LeaveRequestStatus
from app.core.exceptions.exception import DomainError
from app.core.services.base_public_service import BasePublicService
from app.modules.leave.ledger.schemas import LeaveCalculateRequest
from app.modules.leave.ledger.service import LedgerService
from app.modules.leave.leave_type.repository import LeaveTypeRepository
from app.modules.leave.request.schemas import LeaveRequestCreate
from app.modules.leave.request.service import RequestService
from app.modules.my_work.leave.schemas import (
    ApplyLeaveContext,
    CreateLeaveRequestInput,
    LeaveBalance,
    LeaveCalculateInput,
    LeaveCalculateResult,
    LeaveListResponse,
    LeaveRequest,
    LeaveTypeOption,
)

_TYPE_ALIASES = {
    "ANNUAL": "EARNED",
    "ANNUAL_LEAVE": "EARNED",
    "LOP": "LOSS_OF_PAY",
    "UNPAID": "LOSS_OF_PAY",
    "COMP-OFF": "COMP_OFF",
}


def _to_leave_type(value: str) -> str:
    """Normalize caller input to a leave_types code; existence is enforced
    by the domain services against the master table."""
    key = (value or "").strip().upper().replace(" ", "_").replace("-", "_")
    if not key:
        raise DomainError("Leave type is required")
    return _TYPE_ALIASES.get(key, key)


class MyWorkLeaveService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._requests = RequestService(session)
        self._ledger = LedgerService(session)
        self._types = LeaveTypeRepository(session)

    async def list_requests(
        self,
        employment_id: int | None = None,
        *,
        status: str | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 1,
    ) -> LeaveListResponse:
        if employment_id is None:
            return LeaveListResponse(items=[], total=0, page=max(1, offset), pageSize=max(1, limit))
        status_enum: LeaveRequestStatus | None = None
        if status:
            try:
                status_enum = LeaveRequestStatus(status.strip().upper())
            except ValueError:
                status_enum = None
        rows = await self._requests.list_requests(
            employment_id=employment_id, status=status_enum, limit=500, offset=0
        )
        items: list[LeaveRequest] = []
        for r in rows:
            st = r.status.value if hasattr(r.status, "value") else str(r.status)
            lt = str(r.leave_type)
            if search and search.strip().lower() not in f"{lt} {r.reason or ''}".lower():
                continue
            items.append(
                LeaveRequest(
                    id=str(r.id),
                    type=lt,
                    from_date=r.start_date,
                    to_date=r.end_date,
                    days=r.days or Decimal("0"),
                    reason=r.reason or "",
                    status=st.title(),
                    applied_on=r.created_at.date()
                    if hasattr(r.created_at, "date")
                    else r.start_date,
                )
            )
        total = len(items)
        page = max(1, offset)
        page_size = max(1, limit)
        start = (page - 1) * page_size
        return LeaveListResponse(
            items=items[start : start + page_size], total=total, page=page, pageSize=page_size
        )

    async def get_balances(self, employment_id: int | None = None) -> list[LeaveBalance]:
        if employment_id is None:
            return []
        ctx = await self._ledger.get_apply_context(employment_id)
        return [
            LeaveBalance(
                type=str(b.leave_type),
                total=b.total,
                used=b.used,
                remaining=b.remaining,
            )
            for b in ctx.balances
        ]

    async def get_types(self) -> list[LeaveTypeOption]:
        # Catalog comes from the leave_types master table so the
        # self-service list can never drift from the enforced types.
        rows = await self._types.list_types(include_archived=False)
        return [
            LeaveTypeOption(
                value=t.code,
                label=t.name,
                requires_approval=bool(t.requires_approval),
            )
            for t in rows
        ]

    async def get_apply_context(
        self, employment_id: int | None = None
    ) -> ApplyLeaveContext:
        if employment_id is None:
            return ApplyLeaveContext(holidays=[], leaveTypes=[], balances=[])
        ctx = await self._ledger.get_apply_context(employment_id)
        return ApplyLeaveContext(
            holidays=[
                {
                    "date": h.date.isoformat(),
                    "name": h.name,
                    "type": h.holiday_type,
                }
                for h in ctx.holidays
            ],
            leaveTypes=[
                LeaveTypeOption(
                    value=str(t.leave_type),
                    label=t.name,
                    requires_approval=True,
                )
                for t in ctx.leave_types
            ],
            balances=[
                LeaveBalance(
                    type=str(b.leave_type),
                    total=b.total,
                    used=b.used,
                    remaining=b.remaining,
                )
                for b in ctx.balances
            ],
        )

    async def calculate_days(
        self,
        employment_id: int | None = None,
        *,
        input: LeaveCalculateInput,
    ) -> LeaveCalculateResult:
        if employment_id is None:
            raise DomainError("Employment context is required")
        from_date = datetime.strptime(input.from_, "%Y-%m-%d").date()
        to_date = datetime.strptime(input.to, "%Y-%m-%d").date()
        res = await self._ledger.calculate_leave_days(
            LeaveCalculateRequest(
                employment_id=employment_id,
                leave_type=_to_leave_type(input.type),
                start_date=from_date,
                end_date=to_date,
                half_day=input.half_day,
            )
        )
        return LeaveCalculateResult(
            day_cost=res.day_cost,
            balance_remaining=res.balance_remaining,
            estimated_balance_after=res.estimated_balance_after,
            holidays_in_range=[
                {
                    "date": h.date.isoformat(),
                    "name": h.name,
                    "type": h.holiday_type,
                }
                for h in res.holidays_in_range
            ],
        )

    async def submit_request(
        self,
        employment_id: int | None = None,
        *,
        input: CreateLeaveRequestInput,
    ) -> LeaveRequest:
        if employment_id is None:
            raise DomainError("Employment context is required")
        created = await self._requests.submit_request(
            LeaveRequestCreate(
                employment_id=employment_id,
                leave_type=_to_leave_type(input.type),
                start_date=input.from_date,
                end_date=input.to_date,
                reason=input.reason,
            ),
            actor_employment_id=employment_id,
        )
        lt = str(created.leave_type)
        st = created.status.value if hasattr(created.status, "value") else str(created.status)
        return LeaveRequest(
            id=str(created.id),
            type=lt,
            from_date=created.start_date,
            to_date=created.end_date,
            days=created.days or Decimal("0"),
            reason=created.reason or "",
            status=st.title(),
            applied_on=created.created_at.date()
            if hasattr(created.created_at, "date")
            else created.start_date,
            half_day=input.half_day,
        )
