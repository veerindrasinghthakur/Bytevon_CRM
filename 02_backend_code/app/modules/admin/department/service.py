"""DepartmentService — CRUD + member assign/remove stubs."""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.department.models import Department
from app.modules.admin.department.repository import DepartmentRepository
from app.modules.admin.department.schemas import (
    DepartmentCreate,
    DepartmentEmployeeListResponse,
    DepartmentEmployeeOption,
    DepartmentResponse,
    DepartmentUpdate,
    MessageResponse,
)

logger = logging.getLogger(__name__)


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
        existing = await self._repo.get_by_name(data.name)
        if existing:
            raise ConflictError(f"Department '{data.name}' already exists")
        head_id = _optional_id(data.department_head_employment_id)
        dept = Department(
            name=data.name.strip(),
            department_head_employment_id=head_id,
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(dept)
        await self._commit()
        await self._audit("department.created", dept.id, actor_employment_id)
        await self._refresh(dept)
        return DepartmentResponse.model_validate(dept)

    async def get(self, department_id: int) -> DepartmentResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None:
            raise NotFoundError("Department not found")
        return DepartmentResponse.model_validate(dept)

    async def list(self, *, include_archived: bool = False) -> list[DepartmentResponse]:
        rows = await self._repo.list(include_archived=include_archived)
        return [DepartmentResponse.model_validate(r) for r in rows]

    async def update(
        self,
        department_id: int,
        data: DepartmentUpdate,
        *,
        actor_employment_id: int | None = None,
    ) -> DepartmentResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None:
            raise NotFoundError("Department not found")
        if dept.is_archived:
            raise DomainError("Cannot update archived department")
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

    async def archive(
        self, department_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None:
            raise NotFoundError("Department not found")
        if dept.is_archived:
            return MessageResponse(message="Department already archived")
        dept.is_archived = True
        dept.archived_at = datetime.now(UTC)
        await self._commit()
        await self._audit("department.archived", department_id, actor_employment_id)
        return MessageResponse(message="Department archived")

    async def list_employees(
        self,
        department_id: int,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
    ) -> DepartmentEmployeeListResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None:
            raise NotFoundError("Department not found")
        items, total = await self._repo.list_employees(
            department_id, page=page, page_size=page_size, search=search
        )
        return DepartmentEmployeeListResponse(
            items=items, total=total, page=page, pageSize=page_size
        )

    async def list_available(self, department_id: int) -> list[DepartmentEmployeeOption]:
        dept = await self._repo.get_by_id(department_id, include_archived=True)
        if dept is None:
            raise NotFoundError("Department not found")
        return await self._repo.list_available_employees(department_id)

    async def assign(
        self,
        department_id: int,
        employment_id: int,
        *,
        actor_employment_id: int | None = None,
    ) -> MessageResponse:
        dept = await self._repo.get_by_id(department_id, include_archived=False)
        if dept is None:
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
        if dept is None:
            raise NotFoundError("Department not found")
        await self._repo.remove_employee(department_id, employment_id)
        await self._commit()
        await self._audit("department.employee_removed", department_id, actor_employment_id)
        return MessageResponse(message="Employee removed from department")


DepartmentPublicService = DepartmentService
