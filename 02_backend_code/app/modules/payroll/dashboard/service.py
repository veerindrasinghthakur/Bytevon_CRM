"""DashboardService — KPIs, period, activity, monthly summary."""
from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService


def _money(r: Any, *names: str) -> float:
    for n in names:
        v = getattr(r, n, None)
        if v is not None:
            try:
                return float(v)
            except (TypeError, ValueError):
                continue
    return 0.0


def _status_str(r: Any) -> str:
    s: Any = getattr(r, "status", "")
    return s.value if hasattr(s, "value") else str(s)


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self._monthly = MonthlyPayrollService(session)

    async def kpis(
        self, *, year: int | None = None, month: int | None = None
    ) -> dict[str, Any]:
        today = date.today()
        y = year or today.year
        m = month or today.month
        rows = await self._monthly.list_payrolls(year=y, month=m, limit=500)
        total_net = sum(_money(r, "net_salary", "net_pay") for r in rows)
        total_gross = sum(_money(r, "gross_salary", "gross_pay") for r in rows)
        paid = [r for r in rows if _status_str(r).upper() == "PAID"]
        return {
            "employees": len(rows),
            "totalGross": total_gross,
            "totalNet": total_net,
            "paidCount": len(paid),
            "pendingCount": max(0, len(rows) - len(paid)),
            "period": f"{y}-{m:02d}",
        }

    async def period(self) -> dict[str, Any]:
        """Current calendar month; status derived from payroll rows (not hard-coded OPEN)."""
        today = date.today()
        y, m = today.year, today.month
        rows = await self._monthly.list_payrolls(year=y, month=m, limit=500)
        statuses = {_status_str(r).upper() for r in rows}
        if not rows:
            status = "OPEN"
        elif statuses and statuses <= {"PAID"}:
            status = "CLOSED"
        elif "APPROVED" in statuses or "CALCULATED" in statuses:
            status = "IN_PROGRESS"
        else:
            status = "OPEN"
        return {
            "year": y,
            "month": m,
            "label": today.strftime("%B %Y"),
            "status": status,
            "rowCount": len(rows),
        }

    async def activity(self, *, limit: int = 20) -> list[dict[str, Any]]:
        rows = await self._monthly.list_payrolls(limit=limit)
        out: list[dict[str, Any]] = []
        for r in rows:
            y = getattr(r, "year", None)
            m = getattr(r, "month", None)
            title = (
                f"Payroll {y}-{int(m):02d}"
                if y is not None and m is not None
                else f"Payroll #{getattr(r, 'id', '')}"
            )
            out.append(
                {
                    "id": str(getattr(r, "id", "")),
                    "payrollId": getattr(r, "id", None),
                    "title": title,
                    "status": _status_str(r),
                    "time": str(getattr(r, "updated_at", getattr(r, "created_at", ""))),
                }
            )
        return out

    async def monthly_summary(
        self, *, year: int | None = None, month: int | None = None
    ) -> dict[str, Any]:
        today = date.today()
        y = year or today.year
        m = month or today.month
        rows = await self._monthly.list_payrolls(year=y, month=m, limit=500)
        total_gross = sum(_money(r, "gross_salary", "gross_pay") for r in rows)
        total_net = sum(_money(r, "net_salary", "net_pay") for r in rows)
        total_earnings = sum(_money(r, "total_earnings", "gross_salary") for r in rows)
        total_deductions = sum(_money(r, "total_deductions") for r in rows)
        return {
            "year": y,
            "month": m,
            "totalEmployees": len(rows),
            "employeeCount": len(rows),
            "grossSalary": total_gross,
            "totalGross": total_gross,
            "earnings": total_earnings,
            "totalEarnings": total_earnings,
            "deductions": total_deductions,
            "totalDeductions": total_deductions,
            "netPayroll": total_net,
            "totalNet": total_net,
            "pendingApproval": sum(1 for r in rows if _status_str(r).upper() in ("CALCULATED", "DRAFT", "PENDING_APPROVAL")),
            "pendingPayment": sum(1 for r in rows if _status_str(r).upper() in ("APPROVED", "PENDING_PAYMENT", "PENDING")),
            "items": [
                {
                    "payrollId": getattr(r, "id", None),
                    "payroll_id": getattr(r, "id", None),
                    "employmentId": getattr(r, "employment_id", None),
                    "status": _status_str(r),
                }
                for r in rows
            ],
        }
