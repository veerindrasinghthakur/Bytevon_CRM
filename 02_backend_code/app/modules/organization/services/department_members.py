"""Department member roster / assign / remove for OrganizationPublicService."""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import aliased

from app.core.config import settings
from app.core.db.enums import WorkMode
from app.core.exceptions.exception import NotFoundError
from app.modules.organization.schemas.schemas import (
    DepartmentEmployee,
    DepartmentEmployeeListResponse,
    DepartmentEmployeeOption,
    MessageResponse,
)


class DepartmentMembersMixin:
    """Requires BasePublicService helpers: _session, _repo, _commit, _audit."""

    async def list_department_employees(
        self,
        department_id: int,
        *,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
    ) -> DepartmentEmployeeListResponse:
        """One query: all employees currently assigned to the department (paginated)."""
        from app.modules.auth.models import Login, Person
        from app.modules.workforce.models import Employment, EmploymentAssignment, Position

        # Detail view should resolve even if department was archived
        dept = await self._repo.get_department_by_id(
            department_id, include_archived=True
        )
        if dept is None:
            raise NotFoundError("Department not found")

        Pos = aliased(Position)
        base = (
            select(
                Employment.id.label("employment_id"),
                Employment.employee_code,
                Employment.current_state,
                Person.first_name,
                Person.last_name,
                Person.personal_email,
                Pos.name.label("position_name"),
                Login.email.label("login_email"),
            )
            .select_from(EmploymentAssignment)
            .join(Employment, Employment.id == EmploymentAssignment.employment_id)
            .outerjoin(Person, Person.id == Employment.person_id)
            .outerjoin(Pos, Pos.id == EmploymentAssignment.position_id)
            .outerjoin(Login, Login.person_id == Employment.person_id)
            .where(
                EmploymentAssignment.department_id == department_id,
                EmploymentAssignment.effective_to.is_(None),
            )
        )

        if search:
            q = f"%{search.strip()}%"
            base = base.where(
                (Person.first_name.ilike(q))
                | (Person.last_name.ilike(q))
                | (Employment.employee_code.ilike(q))
                | (Login.email.ilike(q))
                | (Person.personal_email.ilike(q))
            )

        count_stmt = select(func.count()).select_from(base.subquery())
        total = int((await self._session.execute(count_stmt)).scalar_one() or 0)

        page = max(1, page)
        page_size = min(max(1, page_size), 200)
        offset = (page - 1) * page_size

        rows = (
            await self._session.execute(
                base.order_by(Person.last_name.nulls_last(), Employment.employee_code)
                .limit(page_size)
                .offset(offset)
            )
        ).all()

        items: list[DepartmentEmployee] = []
        for r in rows:
            first = (r.first_name or "").strip()
            last = (r.last_name or "").strip()
            name = f"{first} {last}".strip() or r.employee_code
            state = (
                r.current_state.value
                if hasattr(r.current_state, "value")
                else str(r.current_state)
            )
            items.append(
                DepartmentEmployee(
                    employmentId=r.employment_id,
                    employeeCode=r.employee_code,
                    name=name,
                    positionName=r.position_name or "—",
                    state=state,
                    email=(r.login_email or r.personal_email or ""),
                )
            )

        return DepartmentEmployeeListResponse(
            items=items,
            total=total,
            page=page,
            pageSize=page_size,
        )

    async def list_employees_available_for_department(
        self, department_id: int
    ) -> list[DepartmentEmployeeOption]:
        from app.modules.auth.models import Person
        from app.modules.workforce.models import Employment, EmploymentAssignment

        dept = await self._repo.get_department_by_id(
            department_id, include_archived=True
        )
        if dept is None:
            raise NotFoundError("Department not found")

        in_dept = set(
            (
                await self._session.execute(
                    select(EmploymentAssignment.employment_id).where(
                        EmploymentAssignment.department_id == department_id,
                        EmploymentAssignment.effective_to.is_(None),
                    )
                )
            )
            .scalars()
            .all()
        )
        emps = (
            await self._session.execute(select(Employment).order_by(Employment.employee_code))
        ).scalars().all()

        options: list[DepartmentEmployeeOption] = []
        for emp in emps:
            if emp.id in in_dept:
                continue
            person = await self._session.get(Person, emp.person_id)
            name = (
                f"{person.first_name} {person.last_name}".strip()
                if person
                else emp.employee_code
            )
            asg = (
                await self._session.execute(
                    select(EmploymentAssignment).where(
                        EmploymentAssignment.employment_id == emp.id,
                        EmploymentAssignment.effective_to.is_(None),
                    )
                )
            ).scalar_one_or_none()
            meta = None
            if asg and asg.department_id:
                other = await self._repo.get_department_by_id(
                    asg.department_id, include_archived=True
                )
                meta = other.name if other else None
            if meta is None:
                meta = (
                    emp.current_state.value
                    if hasattr(emp.current_state, "value")
                    else str(emp.current_state)
                )
            options.append(
                DepartmentEmployeeOption(
                    value=str(emp.id),
                    label=f"{name} ({emp.employee_code})",
                    meta=meta,
                )
            )
        return options

    async def assign_employee_to_department(
        self,
        department_id: int,
        employment_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MessageResponse:
        from app.modules.workforce.models import Employment, EmploymentAssignment

        dept = await self._repo.get_department_by_id(
            department_id, include_archived=True
        )
        if dept is None:
            raise NotFoundError("Department not found")
        emp = await self._session.get(Employment, employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")

        today = date.today()
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID

        current = (
            await self._session.execute(
                select(EmploymentAssignment).where(
                    EmploymentAssignment.employment_id == employment_id,
                    EmploymentAssignment.effective_to.is_(None),
                )
            )
        ).scalar_one_or_none()
        if current and current.department_id == department_id:
            return MessageResponse(message="Employee already in department")

        if current and current.effective_to is None:
            current.effective_to = today
            current.change_reason = "Transferred to another department"

        new_asg = EmploymentAssignment(
            employment_id=employment_id,
            department_id=department_id,
            position_id=current.position_id if current else None,
            location_id=current.location_id if current else None,
            shift_id=current.shift_id if current else None,
            work_mode=current.work_mode if current else WorkMode.OFFICE,
            effective_from=today,
            effective_to=None,
            change_reason="Assigned to department",
            changed_by=actor,
        )
        self._session.add(new_asg)
        await self._commit()
        await self._audit("department.employee_assigned", department_id, actor_employment_id)
        return MessageResponse(message="Employee assigned to department")

    async def remove_employee_from_department(
        self,
        department_id: int,
        employment_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MessageResponse:
        from app.modules.workforce.models import EmploymentAssignment

        dept = await self._repo.get_department_by_id(
            department_id, include_archived=True
        )
        if dept is None:
            raise NotFoundError("Department not found")

        today = date.today()
        current = (
            await self._session.execute(
                select(EmploymentAssignment).where(
                    EmploymentAssignment.employment_id == employment_id,
                    EmploymentAssignment.department_id == department_id,
                    EmploymentAssignment.effective_to.is_(None),
                )
            )
        ).scalar_one_or_none()
        if current is None:
            return MessageResponse(message="Employee not in department")

        current.effective_to = today
        current.change_reason = "Removed from department"

        if dept.department_head_employment_id == employment_id:
            dept.department_head_employment_id = None

        await self._commit()
        await self._audit("department.employee_removed", department_id, actor_employment_id)
        return MessageResponse(message="Employee removed from department")
