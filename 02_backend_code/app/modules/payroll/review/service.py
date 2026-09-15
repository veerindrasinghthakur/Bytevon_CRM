"""ReviewService — approve payroll."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payroll.monthly_payroll.schemas import MonthlyPayrollResponse
from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService


class ReviewService:
    def __init__(self, session: AsyncSession) -> None:
        self._monthly = MonthlyPayrollService(session)

    async def approve_payroll(
        self, payroll_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MonthlyPayrollResponse:
        return await self._monthly.approve_payroll(
            payroll_id, actor_employment_id=actor_employment_id
        )
