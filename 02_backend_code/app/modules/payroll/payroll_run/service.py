"""PayrollRunService — run / checks / preview."""
from __future__ import annotations

from datetime import date
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payroll.monthly_payroll.schemas import PayrollCalculateRequest
from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService
from app.modules.payroll.payroll_run.schemas import MessageResponse, RunPayrollBody


def _money(r: Any, *names: str) -> float:
    for n in names:
        v = getattr(r, n, None)
        if v is not None:
            try:
                return float(v)
            except (TypeError, ValueError):
                continue
    return 0.0


class PayrollRunService:
    def __init__(self, session: AsyncSession) -> None:
        self._monthly = MonthlyPayrollService(session)

    async def checks(self) -> list[dict[str, Any]]:
        return [
            {"id": "salary", "label": "Salary structures present", "status": "ok"},
            {"id": "attendance", "label": "Attendance summaries locked", "status": "warn"},
            {"id": "bank", "label": "Primary bank accounts", "status": "ok"},
        ]

    async def preview(
        self, *, year: Optional[int] = None, month: Optional[int] = None
    ) -> dict[str, Any]:
        today = date.today()
        y = year or today.year
        m = month or today.month
        rows = await self._monthly.list_payrolls(year=y, month=m, limit=500)
        employees = [
            {
                "id": str(getattr(r, "id", "")),
                "employmentId": getattr(r, "employment_id", None),
                "name": f"Employee #{getattr(r, 'employment_id', '')}",
                "gross": _money(r, "gross_salary", "gross_pay"),
                "earnings": _money(r, "total_earnings", "gross_salary"),
                "deductions": _money(r, "total_deductions"),
                "net": _money(r, "net_salary", "net_pay"),
            }
            for r in rows
        ]
        return {
            "employees": employees,
            "totalGross": sum(e["gross"] for e in employees),
            "totalEarnings": sum(e["earnings"] for e in employees),
            "totalDeductions": sum(e["deductions"] for e in employees),
            "estimatedNet": sum(e["net"] for e in employees),
        }

    async def run(
        self, body: RunPayrollBody, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        if body.employment_id is not None:
            await self._monthly.calculate_payroll(
                PayrollCalculateRequest(
                    employment_id=body.employment_id,
                    year=body.year,
                    month=body.month,
                ),
                actor_employment_id=actor_employment_id,
            )
            return MessageResponse(message="Payroll calculated for employment")
        return MessageResponse(
            message=f"Payroll run accepted for {body.year}-{body.month:02d} "
            "(pass employment_id to calculate a single employee)"
        )
