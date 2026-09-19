"""Department repository."""
from __future__ import annotations

from typing import Any, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.admin.department.models import Department


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

    async def list_all(self, *, include_archived: bool = False) -> Sequence[Department]:
        stmt = select(Department).order_by(Department.name)
        if not include_archived:
            stmt = stmt.where(Department.is_archived.is_(False))
        return await self.scalars(stmt)

    async def list(self, *, include_archived: bool = False) -> Sequence[Department]:
        return await self.list_all(include_archived=include_archived)

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
    ) -> tuple[list[Any], int]:
        return [], 0

    async def list_available_employees(self, department_id: int) -> list[Any]:
        return []

    async def assign_employee(self, department_id: int, employment_id: int) -> None:
        return None

    async def remove_employee(self, department_id: int, employment_id: int) -> None:
        return None
