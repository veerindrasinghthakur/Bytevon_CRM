"""PayslipService — get detail + mark paid."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payroll.monthly_payroll.schemas import (
    MonthlyPayrollResponse,
    PayrollPaymentRequest,
)
from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService


class PayslipService:
    def __init__(self, session: AsyncSession) -> None:
        self._monthly = MonthlyPayrollService(session)

    async def get_payroll(self, payroll_id: int) -> MonthlyPayrollResponse:
        return await self._monthly.get_payroll(payroll_id)

    async def mark_paid(
        self,
        payroll_id: int,
        data: PayrollPaymentRequest,
        *,
        actor_employment_id: int | None = None,
    ) -> MonthlyPayrollResponse:
        return await self._monthly.mark_paid(
            payroll_id, data, actor_employment_id=actor_employment_id
        )
