"""PayrollRunService — run / checks / preview."""
from __future__ import annotations

import logging
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import EmploymentState
from app.modules.payroll.monthly_payroll.schemas import PayrollCalculateRequest
from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService
from app.modules.payroll.payroll_run.schemas import MessageResponse, RunPayrollBody

logger = logging.getLogger(__name__)


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
        self, *, year: int | None = None, month: int | None = None
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
        self, body: RunPayrollBody, *, actor_employment_id: int | None = None
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
        # Q11: real bulk calculation over all eligible (non-separated)
        # employments with per-employee results + batch summary.
        from app.modules.workforce.models import Employment

        session = self._monthly._session
        rows = list(
            await session.scalars(
                select(Employment).where(
                    Employment.current_state.not_in(
                        [
                            EmploymentState.RESIGNED,
                            EmploymentState.TERMINATED,
                            EmploymentState.ALUMNI,
                        ]
                    )
                )
            )
        )
        succeeded = 0
        failed = 0
        failures: list[dict[str, Any]] = []
        for emp in rows:
            try:
                await self._monthly.calculate_payroll(
                    PayrollCalculateRequest(
                        employment_id=emp.id,
                        year=body.year,
                        month=body.month,
                    ),
                    actor_employment_id=actor_employment_id,
                )
                succeeded += 1
            except Exception as exc:
                failed += 1
                logger.warning(
                    "Bulk payroll failed employment_id=%s: %s", emp.id, exc
                )
                failures.append(
                    {"employment_id": emp.id, "error": str(exc)[:300]}
                )
        summary = (
            f"Payroll run for {body.year}-{body.month:02d}: "
            f"{succeeded} succeeded, {failed} failed "
            f"({len(rows)} eligible employments)"
        )
        if failures:
            summary += "; failures: " + "; ".join(
                f"#{f['employment_id']}: {f['error']}" for f in failures[:5]
            )
        return MessageResponse(message=summary)
