"""DepartmentService — operational CRUD + members (workforce, canonical owner).

Soft-delete: DELETE sets is_archived=true; rows are never hard-deleted.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.workforce.department.models import Department
from app.modules.workforce.department.repository import DepartmentRepository
from app.modules.workforce.department.schemas import (
    DepartmentCreate,
    DepartmentEmployeeListResponse,
    DepartmentEmployeeOption,
    DepartmentListResponse,
    DepartmentMetrics,
    DepartmentResponse,
    DepartmentUpdate,
    MessageResponse,
)


def _optional_id(value: int | None) -> int | None:
    if value is None or value <= 0:
        return None
    return value


class DepartmentService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = DepartmentRepository(session)

    async def _refresh(self, obj: Any) -> Any:
        await self._session.refresh(obj)
        return obj

    async def create(
        self, data: DepartmentCreate, *, actor_employment_id: int | None = None
    ) -> DepartmentResponse:
        if await self._repo.get_by_name(data.name):
            raise ConflictError(f"Department '{data.name}' already exists")
        dept = Department(
            name=data.name.strip(),
            department_head_employment_id=_optional_id(data.department_head_employment_id),
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(dept)
        await self._commit()
        await self._audit("department.created", dept.id, actor_employment_id)
        await self._refresh(dept)
        return DepartmentResponse.model_validate(dept)

    async def _staff_counts(self, department_ids: set[int]) -> dict[int, int]:
        """Distinct active employments per department (single grouped query)."""
        from datetime import date as _date

        from sqlalchemy import func, select

        from app.modules.workforce.models import EmploymentAssignment

        if not department_ids:
            return {}
        today = _date.today()
        res = await self._session.execute(
            select(
                EmploymentAssignment.department_id,
                func.count(func.distinct(EmploymentAssignment.employment_id)),
            ).where(
                EmploymentAssignment.department_id.in_(department_ids),
                EmploymentAssignment.effective_from <= today,
                (EmploymentAssignment.effective_to.is_(None))
                | (EmploymentAssignment.effective_to >= today),
            ).group_by(EmploymentAssignment.department_id)
        )
        return {int(dept_id): int(count) for dept_id, count in res.all()}

    async def _head_names(self, head_employment_ids: set[int]) -> dict[int, str]:
        """Batched head employment id → person display name (no N+1)."""
        from sqlalchemy import select

        from app.modules.auth.models import Person
        from app.modules.workforce.models import Employment

        ids = {i for i in head_employment_ids if i}
        if not ids:
            return {}
        emps = (
            await self._session.execute(select(Employment).where(Employment.id.in_(ids)))
        ).scalars()
        emp_list = list(emps)
        persons = (
            await self._session.execute(
                select(Person).where(Person.id.in_({e.person_id for e in emp_list}))
            )
        ).scalars()
        names = {p.id: f"{p.first_name} {p.last_name}".strip() for p in persons}
        out: dict[int, str] = {}
        for e in emp_list:
            label = names.get(e.person_id, e.employee_code)
            out[e.id] = label or e.employee_code
        return out

    async def get(
        self, department_id: int, *, include_archived: bool = False
    ) -> DepartmentResponse:
        """Q15: archived rows are hidden by default; history views pass
        include_archived=True and render the Archived badge from the flag."""
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None:
            raise NotFoundError("Department not found")
        if bool(getattr(dept, "is_archived", False)) and not include_archived:
            raise NotFoundError("Department not found")
        resp = DepartmentResponse.model_validate(dept)
        if dept.department_head_employment_id:
            heads = await self._head_names({dept.department_head_employment_id})
            resp.headName = heads.get(dept.department_head_employment_id)
        return resp

    async def list(
        self, *, include_archived: bool = False, include_deleted: bool = False
    ) -> DepartmentListResponse:
        # include_deleted kept as compat alias for include_archived
        show = bool(include_archived or include_deleted)
        rows = await self._repo.list(include_archived=show)
        items = [DepartmentResponse.model_validate(r) for r in rows]
        heads = await self._head_names(
            {r.department_head_employment_id for r in rows if r.department_head_employment_id}
        )
        for item, row in zip(items, rows):
            if row.department_head_employment_id:
                item.headName = heads.get(row.department_head_employment_id)
        staffing = await self._staff_counts({r.id for r in rows})
        for item, row in zip(items, rows):
            item.staffCount = staffing.get(row.id, 0)
        active = sum(1 for i in items if not i.is_archived)
        archived = sum(1 for i in items if i.is_archived)
        metrics = DepartmentMetrics(
            total=len(items),
            active=active,
            archived=archived,
            staffing=sum(staffing.values()),
        )
        return DepartmentListResponse(items=items, total=len(items), metrics=metrics)

    # Back-compat: old callers expect list[...] — expose list_items
    async def list_items(
        self, *, include_archived: bool = False
    ) -> list[DepartmentResponse]:
        res = await self.list(include_archived=include_archived)
        return res.items

    async def update(
        self,
        department_id: int,
        data: DepartmentUpdate,
        *,
        actor_employment_id: int | None = None,
    ) -> DepartmentResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None or bool(getattr(dept, "is_archived", False)):
            raise NotFoundError("Department not found")
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload and payload["name"] is not None:
            name = payload["name"].strip()
            existing = await self._repo.get_by_name(name)
            if existing and existing.id != department_id:
                raise ConflictError(f"Department '{name}' already exists")
            dept.name = name
        if "department_head_employment_id" in payload:
            dept.department_head_employment_id = _optional_id(
                payload["department_head_employment_id"]
            )
        await self._commit()
        await self._audit("department.updated", department_id, actor_employment_id)
        await self._refresh(dept)
        resp = DepartmentResponse.model_validate(dept)
        if dept.department_head_employment_id:
            heads = await self._head_names({dept.department_head_employment_id})
            resp.headName = heads.get(dept.department_head_employment_id)
        return resp

    async def _count_active_assignments(self, department_id: int) -> int:
        """Active (covering today) assignments referencing this department."""
        from datetime import date as _date

        from sqlalchemy import func, select

        from app.modules.workforce.models import EmploymentAssignment

        today = _date.today()
        stmt = select(func.count(EmploymentAssignment.id)).where(
            EmploymentAssignment.department_id == department_id,
            EmploymentAssignment.effective_from <= today,
            (EmploymentAssignment.effective_to.is_(None))
            | (EmploymentAssignment.effective_to >= today),
        )
        res = await self._session.execute(stmt)
        return int(res.scalar() or 0)

    async def delete(
        self, department_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None or bool(getattr(dept, "is_archived", False)):
            raise NotFoundError("Department not found")
        # Q3: cannot archive while actively referenced; reassign first.
        active = await self._count_active_assignments(department_id)
        if active > 0:
            raise ConflictError(
                f"Department is still referenced by {active} active assignment(s); "
                "reassign those employments first"
            )
        dept.is_archived = True
        if hasattr(dept, "archived_at"):
            dept.archived_at = datetime.now(UTC)
        if hasattr(dept, "archived_by"):
            dept.archived_by = actor_employment_id
        await self._commit()
        await self._audit("department.deleted", department_id, actor_employment_id)
        return MessageResponse(message="Department deleted")

    # Deprecated alias — kept so old POST .../archive clients/tests keep working
    async def archive(
        self, department_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        return await self.delete(department_id, actor_employment_id=actor_employment_id)

    async def restore(
        self, department_id: int, *, actor_employment_id: int | None = None
    ) -> DepartmentResponse:
        """Q16: restore an archived department.

        Fails with 409 when an active department already uses the name.
        """
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None:
            raise NotFoundError("Department not found")
        if not bool(getattr(dept, "is_archived", False)):
            raise DomainError("Department is not archived")
        clash = await self._repo.get_by_name(dept.name)
        if clash is not None and clash.id != department_id:
            raise ConflictError(
                f"Cannot restore: department '{dept.name}' already exists"
            )
        dept.is_archived = False
        if hasattr(dept, "archived_at"):
            dept.archived_at = None
        if hasattr(dept, "archived_by"):
            dept.archived_by = None
        await self._commit()
        await self._audit("department.restored", department_id, actor_employment_id)
        await self._refresh(dept)
        return DepartmentResponse.model_validate(dept)

    async def list_employees(
        self,
        department_id: int,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
    ) -> DepartmentEmployeeListResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None or bool(getattr(dept, "is_archived", False)):
            raise NotFoundError("Department not found")
        items, total = await self._repo.list_employees(
            department_id, page=page, page_size=page_size, search=search
        )
        return DepartmentEmployeeListResponse(
            items=items, total=total, page=page, pageSize=page_size
        )

    async def list_available(self, department_id: int) -> list[DepartmentEmployeeOption]:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None or bool(getattr(dept, "is_archived", False)):
            raise NotFoundError("Department not found")
        return await self._repo.list_available_employees(department_id)

    async def assign(
        self,
        department_id: int,
        employment_id: int,
        *,
        actor_employment_id: int | None = None,
    ) -> MessageResponse:
        if await self._repo.get_by_id(department_id, include_archived=False) is None:
            raise NotFoundError("Department not found")
        await self._repo.assign_employee(department_id, employment_id)
        await self._commit()
        await self._audit("department.employee_assigned", department_id, actor_employment_id)
        return MessageResponse(message="Employee assigned to department")

    async def remove(
        self,
        department_id: int,
        employment_id: int,
        *,
        actor_employment_id: int | None = None,
    ) -> MessageResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None or bool(getattr(dept, "is_archived", False)):
            raise NotFoundError("Department not found")
        await self._repo.remove_employee(department_id, employment_id)
        await self._commit()
        await self._audit("department.employee_removed", department_id, actor_employment_id)
        return MessageResponse(message="Employee removed from department")
