"""HistoryService — paid payroll history."""
from __future__ import annotations

from typing import Any, Optional

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
    s = getattr(r, "status", "")
    return s.value if hasattr(s, "value") else str(s)


class HistoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._monthly = MonthlyPayrollService(session)

    async def list_history(
        self,
        *,
        year: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        rows = await self._monthly.list_payrolls(year=year, limit=limit)
        out: list[dict[str, Any]] = []
        for r in rows:
            if _status_str(r).upper() != "PAID":
                continue
            emp_id = getattr(r, "employment_id", None)
            y = getattr(r, "year", "")
            m = getattr(r, "month", 0) or 0
            out.append(
                {
                    "id": str(getattr(r, "id", "")),
                    "period": f"{y}-{int(m):02d}",
                    "employeeId": str(emp_id) if emp_id is not None else "",
                    "paidOn": str(
                        getattr(r, "payment_date", None)
                        or getattr(r, "updated_at", "")
                    ),
                    "gross": _money(r, "gross_salary", "gross_pay"),
                    "net": _money(r, "net_salary", "net_pay"),
                    "ref": getattr(r, "payment_reference", None)
                    or f"TRX-{getattr(r, 'id', '')}",
                }
            )
        if search:
            q = search.lower()
            out = [
                h
                for h in out
                if q in h["period"].lower() or q in (h.get("ref") or "").lower()
            ]
        return out
