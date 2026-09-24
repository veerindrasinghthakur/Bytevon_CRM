"""EmployeePayrollService — employees list + bank accounts."""
from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.auth.models import Person
from app.modules.payroll.employee_payroll.repository import EmployeePayrollRepository
from app.modules.payroll.employee_payroll.schemas import (
    BankAccountCreate,
    BankAccountResponse,
)
from app.modules.payroll.models import EmployeeBankAccount
from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService
from app.modules.workforce.models import Employment


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


class EmployeePayrollService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = EmployeePayrollRepository(session)
        self._monthly = MonthlyPayrollService(session)

    async def _employment_display(self, employment_ids: set[int]) -> dict[int, dict[str, str]]:
        if not employment_ids:
            return {}
        rows = (
            await self._session.execute(
                select(Employment.id, Employment.employee_code, Person.first_name, Person.last_name)
                .join(Person, Person.id == Employment.person_id)
                .where(Employment.id.in_(list(employment_ids)))
            )
        ).all()
        out: dict[int, dict[str, str]] = {}
        for eid, code, first, last in rows:
            name = f"{(first or '').strip()} {(last or '').strip()}".strip() or f"Employee #{eid}"
            out[int(eid)] = {"name": name, "code": code or f"EMP-{eid}"}
        return out

    async def list_employees(
        self,
        *,
        year: int | None = None,
        month: int | None = None,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        status: str | None = None,
    ) -> dict[str, Any]:
        today = date.today()
        y = year or today.year
        m = month or today.month
        rows = await self._monthly.list_payrolls(year=y, month=m, limit=500)
        emp_ids = {int(getattr(r, "employment_id")) for r in rows if getattr(r, "employment_id", None)}
        display = await self._employment_display(emp_ids)

        items: list[dict[str, Any]] = []
        for r in rows:
            emp_id = getattr(r, "employment_id", None)
            pid = getattr(r, "id", None)
            st = _status_str(r)
            if status and st.upper() != status.upper():
                continue
            info = display.get(int(emp_id), {}) if emp_id is not None else {}
            gross = _money(r, "gross_salary", "gross_pay")
            items.append(
                {
                    "id": str(pid),
                    "payrollId": pid,
                    "payroll_id": pid,
                    "employmentId": emp_id,
                    "employment_id": emp_id,
                    "name": info.get("name") or f"Employee #{emp_id}",
                    "code": info.get("code") or f"EMP-{emp_id}",
                    "department": "—",
                    "status": st,
                    "gross": gross,
                    "earnings": _money(r, "total_earnings", "gross_salary"),
                    "deductions": _money(r, "total_deductions"),
                    "net": _money(r, "net_salary", "net_pay"),
                    "paymentRef": getattr(r, "payment_reference", None),
                }
            )
        if search:
            q = search.lower()
            items = [
                e
                for e in items
                if q in e["name"].lower()
                or q in e["code"].lower()
                or q in str(e["id"])
                or q in str(e.get("employmentId") or "")
            ]
        total = len(items)
        start = (page - 1) * page_size
        page_items = items[start : start + page_size]
        return {
            "items": page_items,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "metrics": {
                "totalGross": sum(e["gross"] for e in items),
                "totalNet": sum(e["net"] for e in items),
                "count": total,
            },
        }

    async def add_bank_account(
        self,
        data: BankAccountCreate,
        *,
        actor_employment_id: int | None = None,
    ) -> BankAccountResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        if data.is_primary:
            await self._repo.clear_primary(data.employment_id)
        acc = EmployeeBankAccount(
            employment_id=data.employment_id,
            account_holder_name=data.account_holder_name,
            bank_name=data.bank_name,
            account_number=data.account_number,
            ifsc_code=data.ifsc_code,
            account_type=data.account_type,
            is_primary=data.is_primary,
            is_active=True,
            changed_by=actor,
        )
        await self._repo.add(acc)
        await self._commit()
        return BankAccountResponse.model_validate(acc)

    async def list_bank_accounts(
        self, employment_id: int
    ) -> list[BankAccountResponse]:
        rows = await self._repo.list_bank_accounts(employment_id)
        return [BankAccountResponse.model_validate(r) for r in rows]

    async def get_primary_bank(self, employment_id: int) -> BankAccountResponse:
        acc = await self._repo.get_primary_bank(employment_id)
        if acc is None:
            raise NotFoundError("No primary bank account")
        return BankAccountResponse.model_validate(acc)
