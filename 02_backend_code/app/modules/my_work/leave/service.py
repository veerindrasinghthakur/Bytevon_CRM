"""My Work Leave Service — self-service stubs (safe empty responses)."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.leave.repository import MyWorkLeaveRepository
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


class MyWorkLeaveService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MyWorkLeaveRepository(session)

    async def list_requests(
        self,
        employment_id: Optional[int] = None,
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 1,
    ) -> LeaveListResponse:
        page = max(1, offset)
        page_size = max(1, limit)
        return LeaveListResponse(items=[], total=0, page=page, pageSize=page_size)

    async def get_balances(self, employment_id: Optional[int] = None) -> List[LeaveBalance]:
        return []

    async def get_types(self) -> List[LeaveTypeOption]:
        rows = await self._repo.get_types()
        return [
            LeaveTypeOption(
                value=r["value"],
                label=r["label"],
                requires_approval=bool(r.get("requires_approval", True)),
            )
            for r in rows
        ]

    async def get_apply_context(
        self, employment_id: Optional[int] = None
    ) -> ApplyLeaveContext:
        return ApplyLeaveContext(
            holidays=[],
            leaveTypes=await self.get_types(),
            balances=await self.get_balances(employment_id),
        )

    async def calculate_days(
        self,
        employment_id: Optional[int] = None,
        *,
        input: LeaveCalculateInput,
    ) -> LeaveCalculateResult:
        from_date = datetime.strptime(input.from_, "%Y-%m-%d").date()
        to_date = datetime.strptime(input.to, "%Y-%m-%d").date()
        if to_date < from_date:
            from_date, to_date = to_date, from_date

        day_cost = Decimal("0")
        current = from_date
        while current <= to_date:
            if current.weekday() < 5:
                day_cost += Decimal("1")
            current += timedelta(days=1)

        if input.half_day and day_cost >= 1:
            day_cost = Decimal("0.5")

        return LeaveCalculateResult(
            day_cost=day_cost,
            balance_remaining=None,
            estimated_balance_after=None,
            holidays_in_range=[],
        )

    async def submit_request(
        self,
        employment_id: Optional[int] = None,
        *,
        input: CreateLeaveRequestInput,
    ) -> LeaveRequest:
        # Stub acceptance shape — real persist via leave.request domain later
        return LeaveRequest(
            id=str(uuid4()),
            type=input.type,
            from_date=input.from_date,
            to_date=input.to_date,
            days=Decimal("1"),
            reason=input.reason,
            status="Pending",
            applied_on=date.today(),
            half_day=input.half_day,
        )
