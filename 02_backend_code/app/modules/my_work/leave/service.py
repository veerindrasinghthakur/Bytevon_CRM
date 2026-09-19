"""My Work Leave Service."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import List, Optional
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func

from app.core.config import settings
from app.core.db.enums import HolidayType
from app.core.services.base_public_service import BasePublicService
from app.modules.leave.models import LeaveRequest, LeaveType, LeaveBalance
from app.modules.my_work.leave.repository import MyWorkLeaveRepository
from app.modules.my_work.leave.schemas import (
    LeaveBalance,
    LeaveRequest,
    LeaveListResponse,
    LeaveTypeOption,
    ApplyLeaveContext,
    CreateLeaveRequestInput,
    LeaveCalculateInput,
    LeaveCalculateResult,
)


class MyWorkLeaveService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MyWorkLeaveRepository(session)

    async def list_requests(
        self, employment_id: int, *, status: Optional[str] = None,
        search: Optional[str] = None, limit: int = 20, offset: int = 1
    ) -> LeaveListResponse:
        items = await self._repo.list_my_requests(
            employment_id, status=status, search=search, limit=limit, offset=offset
        )
        total = await self._repo.count_my_requests(employment_id, status=status, search=search)
        return LeaveListResponse(
            items=[LeaveRequest.model_validate(i) for i in items],
            total=total,
            page=offset,
            pageSize=limit,
        )

    async def get_balances(self, employment_id: int) -> List[LeaveBalance]:
        balances = await self._repo.get_balances(employment_id)
        return [LeaveBalance.model_validate(b) for b in balances]

    async def get_types(self) -> List[LeaveTypeOption]:
        types = await self._repo.get_types()
        return [LeaveTypeOption(value=t.code, label=t.name, requires_approval=t.requires_approval) for t in types]

    async def get_apply_context(self, employment_id: int) -> ApplyLeaveContext:
        balances = await self.get_balances(employment_id)
        types = await self.get_types()
        holidays = []  # Fetch from holiday calendar
        return ApplyLeaveContext(holidays=holidays, leaveTypes=types, balances=balances)

    async def calculate_days(
        self, employment_id: int, input: LeaveCalculateInput
    ) -> LeaveCalculateResult:
        # Implement working day calculation with holidays
        holiday_dates = set()  # Load from holiday calendar
        from_date = datetime.strptime(input.from_, "%Y-%m-%d").date()
        to_date = datetime.strptime(input.to, "%Y-%m-%d").date()
        
        # Count working days (Mon-Fri, excluding holidays)
        day_cost = 0
        current = from_date
        while current <= to_date:
            if current.weekday() < 5 and str(current) not in holiday_dates:
                day_cost += Decimal("1")
            current = date.fromordinal(current.toordinal() + 1)
        
        if input.half_day and day_cost >= 1:
            day_cost = Decimal("0.5")
        
        # Get balance for this leave type
        bal = None
        # TODO: Find balance by type
        
        # Get holidays in range
        holidays_in_range = []
        
        return LeaveCalculateResult(
            day_cost=day_cost,
            balance_remaining=bal.remaining if bal else None,
            estimated_balance_after=bal.remaining - day_cost if bal else None,
            holidays_in_range=holidays_in_range,
        )

    async def submit_request(
        self, employment_id: int, input: CreateLeaveRequestInput
    ) -> LeaveRequest:
        # Create leave request
        from app.modules.leave.models import LeaveRequest as LeaveModel
        from uuid import uuid4
        
        leave = LeaveModel(
            id=str(uuid4()),
            type=input.type,
            from_date=input.from_date,
            to_date=input.to_date,
            days=0,  # Will be calculated
            reason=input.reason,
            status="Pending",
            applied_on=date.today(),
            employment_id=employment_id,
            half_day=input.half_day,
        )
        # TODO: Add to database via repository
        return LeaveRequest.model_validate(leave)