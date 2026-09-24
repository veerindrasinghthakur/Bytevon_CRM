"""SalaryManagementService — versioned salary config."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.payroll.models import EmployeeSalary, EmployeeSalaryItem
from app.modules.payroll.salary_management.repository import SalaryRepository
from app.modules.payroll.salary_management.schemas import (
    EmployeeSalaryCreate,
    EmployeeSalaryItemResponse,
    EmployeeSalaryResponse,
)


def _salary_response(s: EmployeeSalary) -> EmployeeSalaryResponse:
    return EmployeeSalaryResponse(
        id=s.id,
        employment_id=s.employment_id,
        effective_from=s.effective_from,
        effective_to=s.effective_to,
        gross_salary=s.gross_salary,
        created_at=s.created_at,
        updated_at=s.updated_at,
        changed_by=s.changed_by,
        items=[EmployeeSalaryItemResponse.model_validate(i) for i in (s.items or [])],
    )


class SalaryManagementService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = SalaryRepository(session)

    async def create_salary(
        self,
        data: EmployeeSalaryCreate,
        *,
        actor_employment_id: int | None = None,
    ) -> EmployeeSalaryResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        current = await self._repo.get_current_salary(
            data.employment_id, as_of=data.effective_from
        )
        if current and current.effective_to is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_salary(current.id, close_to)

        salary = EmployeeSalary(
            employment_id=data.employment_id,
            effective_from=data.effective_from,
            effective_to=None,
            gross_salary=data.gross_salary,
            changed_by=actor,
        )
        await self._repo.add(salary)
        await self._flush()
        for item in data.items:
            await self._repo.add(
                EmployeeSalaryItem(
                    employee_salary_id=salary.id,
                    name=item.name,
                    type=item.type,
                    amount=item.amount,
                    changed_by=actor,
                )
            )
        await self._commit()
        salary = await self._repo.get_salary_by_id(salary.id, with_items=True)
        if salary is None:
            raise NotFoundError("Salary configuration not found after create")
        await self._audit("employee_salary.created", salary.id, actor)
        return _salary_response(salary)

    async def get_current_salary(
        self, employment_id: int, *, as_of: date | None = None
    ) -> EmployeeSalaryResponse:
        salary = await self._repo.get_current_salary(employment_id, as_of=as_of)
        if salary is None:
            raise NotFoundError("No effective salary configuration")
        return _salary_response(salary)

    async def list_salaries(self, employment_id: int) -> list[EmployeeSalaryResponse]:
        rows = await self._repo.list_salaries(employment_id)
        return [_salary_response(r) for r in rows]
