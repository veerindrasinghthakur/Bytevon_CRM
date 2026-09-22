"""ReviewService — approve payroll."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payroll.monthly_payroll.schemas import MonthlyPayrollResponse
from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService


class ReviewService:
    def __init__(self, session: AsyncSession) -> None:
        self._monthly = MonthlyPayrollService(session)

    async def approve_payroll(
        self, payroll_id: int, *, actor_employment_id: int | None = None
    ) -> MonthlyPayrollResponse:
        return await self._monthly.approve_payroll(
            payroll_id, actor_employment_id=actor_employment_id
        )

    async def reject_payroll(
        self,
        payroll_id: int,
        *,
        reason: str,
        actor_employment_id: int | None = None,
    ) -> MonthlyPayrollResponse:
        """Q4: APPROVED → CALCULATED reject/reset with reason + audit."""
        return await self._monthly.reject_payroll(
            payroll_id, reason=reason, actor_employment_id=actor_employment_id
        )
