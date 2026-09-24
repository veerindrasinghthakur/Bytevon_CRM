"""SalaryManagementService — versioned salary config."""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import EmploymentState, SalaryItemType
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.payroll.models import EmployeeSalary, EmployeeSalaryItem
from app.modules.payroll.salary_management.repository import SalaryRepository
from app.modules.payroll.salary_management.schemas import (
    EmployeeSalaryCreate,
    EmployeeSalaryItemResponse,
    EmployeeSalaryResponse,
)
from app.modules.workforce.models import Employment


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
        """Create a new salary version (never updates in place).

        Rules:
        - gross_salary must equal the sum of EARNING items (when items given).
        - The new version must start strictly after every open version's start;
          backdated or same-day starts are rejected, not silently skipped.
        - The new open-ended version must not overlap any closed version.
        - All open versions starting on/before the new start are closed to
          new_from - 1 day (normally exactly one).
        """
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        if data.items:
            earning_total = sum(
                (i.amount for i in data.items if i.type == SalaryItemType.EARNING),
                Decimal("0"),
            )
            if Decimal(data.gross_salary) != earning_total:
                raise DomainError(
                    f"gross_salary {data.gross_salary} must equal the sum of "
                    f"EARNING items ({earning_total})"
                )
        versions = await self._repo.list_salaries(data.employment_id)
        for v in versions:
            if v.effective_to is None:
                if v.effective_from >= data.effective_from:
                    raise DomainError(
                        f"New salary version starting {data.effective_from} must "
                        f"start strictly after open version starting "
                        f"{v.effective_from}"
                    )
            elif v.effective_to >= data.effective_from:
                raise DomainError(
                    f"New salary version starting {data.effective_from} overlaps "
                    f"closed version {v.effective_from}–{v.effective_to}"
                )
        for v in versions:
            if v.effective_to is None and v.effective_from < data.effective_from:
                await self._repo.close_salary(
                    v.id, data.effective_from - timedelta(days=1)
                )

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

    async def list_unconfigured_employment_ids(
        self, session: AsyncSession
    ) -> list[int]:
        """Active employments with no open salary version (picker source)."""
        configured = await self._repo.employment_ids_with_open_salary()
        active = (
            await session.execute(
                select(Employment.id).where(
                    Employment.current_state.not_in(
                        [
                            EmploymentState.RESIGNED,
                            EmploymentState.TERMINATED,
                            EmploymentState.ALUMNI,
                        ]
                    )
                )
            )
        ).scalars().all()
        return sorted(int(eid) for eid in active if int(eid) not in configured)

    async def list_open_salaries(
        self, session: AsyncSession, *, search: str | None = None
    ) -> list[dict]:
        """All open salary versions with employment display (salary page source)."""
        from app.modules.auth.models import Person
        from app.modules.workforce.department.models import Department
        from app.modules.workforce.models import (
            Employment,
            EmploymentAssignment,
            Position,
        )

        rows = (
            await session.execute(
                select(
                    EmployeeSalary,
                    Employment.employee_code,
                    Person.first_name,
                    Person.last_name,
                    Department.name,
                    Position.name,
                )
                .join(Employment, Employment.id == EmployeeSalary.employment_id)
                .join(Person, Person.id == Employment.person_id)
                .outerjoin(
                    EmploymentAssignment,
                    (EmploymentAssignment.employment_id == Employment.id)
                    & (EmploymentAssignment.effective_to.is_(None)),
                )
                .outerjoin(Department, Department.id == EmploymentAssignment.department_id)
                .outerjoin(Position, Position.id == EmploymentAssignment.position_id)
                .where(EmployeeSalary.effective_to.is_(None))
                .order_by(EmployeeSalary.employment_id)
            )
        ).all()
        out: list[dict] = []
        for salary, code, first, last, dept, pos in rows:
            name = f"{(first or '').strip()} {(last or '').strip()}".strip() or code
            if search:
                q = search.lower()
                if (
                    q not in name.lower()
                    and q not in (code or "").lower()
                    and q not in (dept or "").lower()
                ):
                    continue
            out.append(
                {
                    "employment_id": salary.employment_id,
                    "employmentId": salary.employment_id,
                    "name": name,
                    "code": code,
                    "department": dept or "—",
                    "role": pos or "—",
                    "gross_salary": str(salary.gross_salary),
                    "effective_from": str(salary.effective_from),
                    "effectiveFrom": str(salary.effective_from),
                    "status": "ACTIVE",
                    "salaryStatus": "ACTIVE",
                }
            )
        return out
