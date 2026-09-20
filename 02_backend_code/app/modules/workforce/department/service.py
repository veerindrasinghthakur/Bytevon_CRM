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

    async def get(self, department_id: int) -> DepartmentResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None or bool(getattr(dept, "is_archived", False)):
            raise NotFoundError("Department not found")
        return DepartmentResponse.model_validate(dept)

    async def list(
        self, *, include_archived: bool = False, include_deleted: bool = False
    ) -> DepartmentListResponse:
        # include_deleted kept as compat alias for include_archived
        show = bool(include_archived or include_deleted)
        rows = await self._repo.list(include_archived=show)
        items = [DepartmentResponse.model_validate(r) for r in rows]
        active = sum(1 for i in items if not i.is_archived)
        archived = sum(1 for i in items if i.is_archived)
        metrics = DepartmentMetrics(total=len(items), active=active, archived=archived, staffing=0)
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
        return DepartmentResponse.model_validate(dept)

    async def delete(
        self, department_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None or bool(getattr(dept, "is_archived", False)):
            raise NotFoundError("Department not found")
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
