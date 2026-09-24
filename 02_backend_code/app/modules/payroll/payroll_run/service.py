"""PayrollRunService — run / checks / preview."""
from __future__ import annotations

import logging
from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import EmploymentState
from app.modules.auth.models import Person
from app.modules.payroll.models import EmployeeBankAccount, EmployeeSalary
from app.modules.payroll.monthly_payroll.schemas import PayrollCalculateRequest
from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService
from app.modules.payroll.payroll_run.schemas import MessageResponse, RunPayrollBody
from app.modules.workforce.models import Employment

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
        self._session = session
        self._monthly = MonthlyPayrollService(session)

    async def checks(self) -> list[dict[str, Any]]:
        """Live readiness checks from DB (not hardcoded ok/warn)."""
        active_emps = list(
            await self._session.scalars(
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
        emp_ids = [e.id for e in active_emps]
        salary_count = 0
        bank_count = 0
        if emp_ids:
            salary_count = int(
                (
                    await self._session.execute(
                        select(func.count())
                        .select_from(EmployeeSalary)
                        .where(
                            EmployeeSalary.employment_id.in_(emp_ids),
                            EmployeeSalary.effective_to.is_(None),
                        )
                    )
                ).scalar_one()
                or 0
            )
            bank_count = int(
                (
                    await self._session.execute(
                        select(func.count())
                        .select_from(EmployeeBankAccount)
                        .where(
                            EmployeeBankAccount.employment_id.in_(emp_ids),
                            EmployeeBankAccount.is_primary.is_(True),
                            EmployeeBankAccount.is_active.is_(True),
                        )
                    )
                ).scalar_one()
                or 0
            )

        n = len(emp_ids) or 1

        def _status(have: int, need: int) -> str:
            if have >= need:
                return "ok"
            if have == 0:
                return "error"
            return "warn"

        return [
            {
                "id": "salary",
                "label": "Salary structures present",
                "status": _status(salary_count, len(emp_ids)),
                "detail": f"{salary_count}/{len(emp_ids)} active employments",
            },
            {
                "id": "bank",
                "label": "Primary bank accounts",
                "status": _status(bank_count, len(emp_ids)),
                "detail": f"{bank_count}/{len(emp_ids)} active employments",
            },
            {
                "id": "eligible",
                "label": "Eligible employments",
                "status": "ok" if emp_ids else "warn",
                "detail": f"{len(emp_ids)} non-separated employments",
            },
        ]

    async def preview(
        self, *, year: int | None = None, month: int | None = None
    ) -> dict[str, Any]:
        today = date.today()
        y = year or today.year
        m = month or today.month
        rows = await self._monthly.list_payrolls(year=y, month=m, limit=500)
        emp_ids = {
            int(getattr(r, "employment_id"))
            for r in rows
            if getattr(r, "employment_id", None) is not None
        }
        display: dict[int, dict[str, str]] = {}
        if emp_ids:
            for eid, code, first, last in (
                await self._session.execute(
                    select(
                        Employment.id,
                        Employment.employee_code,
                        Person.first_name,
                        Person.last_name,
                    )
                    .join(Person, Person.id == Employment.person_id)
                    .where(Employment.id.in_(list(emp_ids)))
                )
            ).all():
                name = f"{(first or '').strip()} {(last or '').strip()}".strip()
                display[int(eid)] = {"name": name, "code": code}
        employees = []
        for r in rows:
            emp_id = getattr(r, "employment_id", None)
            info = display.get(int(emp_id), {}) if emp_id is not None else {}
            employees.append(
                {
                    "id": str(getattr(r, "id", "")),
                    "payrollId": getattr(r, "id", None),
                    "employmentId": emp_id,
                    "name": info.get("name") or None,
                    "code": info.get("code"),
                    "gross": _money(r, "gross_salary", "gross_pay"),
                    "earnings": _money(r, "total_earnings", "gross_salary"),
                    "deductions": _money(r, "total_deductions"),
                    "net": _money(r, "net_salary", "net_pay"),
                }
            )
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

        rows = list(
            await self._session.scalars(
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
