"""HistoryService — paid payroll history."""
from __future__ import annotations

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


class HistoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._monthly = MonthlyPayrollService(session)

    def _row_dict(self, r: Any) -> dict[str, Any]:
        emp_id = getattr(r, "employment_id", None)
        y = getattr(r, "year", "")
        m = getattr(r, "month", 0) or 0
        pid = getattr(r, "id", None)
        return {
            "id": str(pid),
            "payrollId": pid,
            "payroll_id": pid,
            "period": f"{y}-{int(m):02d}",
            "employeeId": str(emp_id) if emp_id is not None else "",
            "employmentId": emp_id,
            "employment_id": emp_id,
            "status": _status_str(r),
            "paidOn": str(
                getattr(r, "payment_date", None) or getattr(r, "updated_at", "")
            ),
            "gross": _money(r, "gross_salary", "gross_pay"),
            "net": _money(r, "net_salary", "net_pay"),
            "ref": getattr(r, "payment_reference", None) or f"TRX-{pid}",
        }

    async def list_history(
        self,
        *,
        year: int | None = None,
        search: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        rows = await self._monthly.list_payrolls(year=year, limit=limit)
        out: list[dict[str, Any]] = []
        for r in rows:
            if _status_str(r).upper() != "PAID":
                continue
            out.append(self._row_dict(r))
        if search:
            q = search.lower()
            out = [
                h
                for h in out
                if q in h["period"].lower() or q in (h.get("ref") or "").lower()
            ]
        return out

    async def list_employee_history(
        self,
        employment_id: int,
        *,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """All periods for one employment (any status)."""
        rows = await self._monthly.list_payrolls(
            employment_id=employment_id, limit=limit
        )
        return [self._row_dict(r) for r in rows]
