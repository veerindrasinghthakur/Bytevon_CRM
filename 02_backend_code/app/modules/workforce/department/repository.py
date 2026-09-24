"""Department repository — operational queries (canonical owner: workforce).

Uses Department model from workforce.department.models (shared table).
Member listing uses employment assignments (department_id).
Soft-delete: normal queries exclude is_archived=True rows.
"""
from __future__ import annotations

from collections.abc import Sequence
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.auth.models import Person
from app.modules.workforce.department.models import Department
from app.modules.workforce.department.schemas import DepartmentEmployee, DepartmentEmployeeOption
from app.modules.workforce.models import Employment, EmploymentAssignment, Position


async def _person_info(
    session: AsyncSession, person_ids: set[int]
) -> dict[int, tuple[str, str]]:
    """Batched person id → (display name, email). Single query, no N+1."""
    if not person_ids:
        return {}
    rows = (
        await session.execute(select(Person).where(Person.id.in_(person_ids)))
    ).scalars()
    return {
        p.id: (f"{p.first_name} {p.last_name}".strip(), p.personal_email or "")
        for p in rows
    }


class DepartmentRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_id(
        self, department_id: int, *, include_archived: bool = False
    ) -> Department | None:
        stmt = select(Department).where(Department.id == department_id)
        if not include_archived:
            stmt = stmt.where(Department.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list(self, *, include_archived: bool = False) -> Sequence[Department]:
        stmt = select(Department).order_by(Department.name)
        if not include_archived:
            stmt = stmt.where(Department.is_archived.is_(False))
        return await self.scalars(stmt)

    async def get_by_name(self, name: str) -> Department | None:
        stmt = select(Department).where(
            Department.name == name, Department.is_archived.is_(False)
        )
        return await self.scalar_one_or_none(stmt)

    async def count_active(self) -> int:
        stmt = select(func.count(Department.id)).where(Department.is_archived.is_(False))
        res = await self._session.execute(stmt)
        return int(res.scalar() or 0)

    async def count_archived(self) -> int:
        stmt = select(func.count(Department.id)).where(Department.is_archived.is_(True))
        res = await self._session.execute(stmt)
        return int(res.scalar() or 0)

    async def list_employees(
        self,
        department_id: int,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
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
        info = await _person_info(self._session, {e.person_id for e in rows})
        # Current assignments for position names (one query for all rows).
        asgs = list(
            await self.scalars(
                select(EmploymentAssignment).where(
                    EmploymentAssignment.employment_id.in_([e.id for e in rows]),
                    EmploymentAssignment.effective_from <= today,
                    (EmploymentAssignment.effective_to.is_(None))
                    | (EmploymentAssignment.effective_to >= today),
                )
            )
        ) if rows else []
        asg_by_emp = {a.employment_id: a for a in asgs}
        pos_ids = {a.position_id for a in asgs if a.position_id}
        pos_rows = (
            list(await self.scalars(select(Position).where(Position.id.in_(pos_ids))))
            if pos_ids
            else []
        )
        pos_names = {p.id: p.name for p in pos_rows}
        items = []
        for e in rows:
            name, email = info.get(e.person_id, (e.employee_code, ""))
            asg = asg_by_emp.get(e.id)
            items.append(
                DepartmentEmployee(
                    employmentId=e.id,
                    employeeCode=e.employee_code,
                    name=name or e.employee_code,
                    positionName=(
                        pos_names.get(asg.position_id, "—") if asg and asg.position_id else "—"
                    ),
                    email=email,
                    state=e.current_state.value
                    if hasattr(e.current_state, "value")
                    else str(e.current_state),
                )
            )
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
        info = await _person_info(self._session, {e.person_id for e in rows})
        return [
            DepartmentEmployeeOption(
                value=str(e.id),
                label=f"{info.get(e.person_id, (e.employee_code, ''))[0] or e.employee_code} ({e.employee_code})",
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
            # Q1 canonical temporal model: predecessor ends the day before the
            # new row starts so active periods never overlap.
            from datetime import timedelta as _td

            close_to = today - _td(days=1)
            current.effective_to = (
                close_to if close_to >= current.effective_from else today
            )
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
