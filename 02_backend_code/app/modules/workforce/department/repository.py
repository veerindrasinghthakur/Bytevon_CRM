"""Department repository — operational queries.

Uses Department model from organization.models (shared table).
Member listing uses employment assignments (department_id).
"""
from __future__ import annotations

from datetime import date
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.admin.department.models import Department
from app.modules.workforce.department.schemas import DepartmentEmployee, DepartmentEmployeeOption
from app.modules.workforce.models import Employment, EmploymentAssignment


class DepartmentRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_id(
        self, department_id: int, *, include_archived: bool = False
    ) -> Optional[Department]:
        stmt = select(Department).where(Department.id == department_id)
        if not include_archived:
            stmt = stmt.where(Department.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list(self, *, include_archived: bool = False) -> Sequence[Department]:
        stmt = select(Department).order_by(Department.name)
        if not include_archived:
            stmt = stmt.where(Department.is_archived.is_(False))
        return await self.scalars(stmt)

    async def get_by_name(self, name: str) -> Optional[Department]:
        stmt = select(Department).where(
            Department.name == name, Department.is_archived.is_(False)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_employees(
        self,
        department_id: int,
        *,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
    ) -> tuple[list[DepartmentEmployee], int]:
        today = date.today()
        stmt = (
            select(Employment)
            .join(
                EmploymentAssignment,
                EmploymentAssignment.employment_id == Employment.id,
            )
            .where(
                EmploymentAssignment.department_id == department_id,
                EmploymentAssignment.effective_from <= today,
                (EmploymentAssignment.effective_to.is_(None))
                | (EmploymentAssignment.effective_to >= today),
            )
            .order_by(Employment.employee_code)
        )
        rows = list(await self.scalars(stmt))
        items = [
            DepartmentEmployee(
                employmentId=e.id,
                employeeCode=e.employee_code,
                name=e.employee_code,
                state=e.current_state.value
                if hasattr(e.current_state, "value")
                else str(e.current_state),
            )
            for e in rows
        ]
        if search:
            q = search.strip().lower()
            items = [
                i
                for i in items
                if q in i.employeeCode.lower() or q in i.name.lower()
            ]
        total = len(items)
        start = (page - 1) * page_size
        return items[start : start + page_size], total

    async def list_available_employees(
        self, department_id: int
    ) -> list[DepartmentEmployeeOption]:
        today = date.today()
        assigned = select(EmploymentAssignment.employment_id).where(
            EmploymentAssignment.department_id == department_id,
            EmploymentAssignment.effective_from <= today,
            (EmploymentAssignment.effective_to.is_(None))
            | (EmploymentAssignment.effective_to >= today),
        )
        stmt = (
            select(Employment)
            .where(Employment.id.not_in(assigned))
            .order_by(Employment.employee_code)
            .limit(200)
        )
        rows = await self.scalars(stmt)
        return [
            DepartmentEmployeeOption(
                value=str(e.id),
                label=e.employee_code,
                meta=e.current_state.value
                if hasattr(e.current_state, "value")
                else str(e.current_state),
            )
            for e in rows
        ]

    async def assign_employee(self, department_id: int, employment_id: int) -> None:
        from app.core.db.enums import WorkMode

        today = date.today()
        current = await self.scalar_one_or_none(
            select(EmploymentAssignment)
            .where(
                EmploymentAssignment.employment_id == employment_id,
                EmploymentAssignment.effective_from <= today,
                (EmploymentAssignment.effective_to.is_(None))
                | (EmploymentAssignment.effective_to >= today),
            )
            .order_by(EmploymentAssignment.effective_from.desc())
            .limit(1)
        )
        if current and current.department_id == department_id:
            return
        if current and current.effective_to is None:
            current.effective_to = today
        asg = EmploymentAssignment(
            employment_id=employment_id,
            department_id=department_id,
            position_id=current.position_id if current else None,
            location_id=current.location_id if current else None,
            shift_id=current.shift_id if current else None,
            work_mode=current.work_mode if current else WorkMode.OFFICE,
            effective_from=today,
            effective_to=None,
            change_reason="Department assign",
        )
        await self.add(asg)

    async def remove_employee(self, department_id: int, employment_id: int) -> None:
        today = date.today()
        current = await self.scalar_one_or_none(
            select(EmploymentAssignment)
            .where(
                EmploymentAssignment.employment_id == employment_id,
                EmploymentAssignment.department_id == department_id,
                EmploymentAssignment.effective_from <= today,
                (EmploymentAssignment.effective_to.is_(None))
                | (EmploymentAssignment.effective_to >= today),
            )
            .order_by(EmploymentAssignment.effective_from.desc())
            .limit(1)
        )
        if current and current.effective_to is None:
            current.effective_to = today
