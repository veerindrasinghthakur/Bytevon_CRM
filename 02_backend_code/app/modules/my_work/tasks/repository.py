"""My Work Task repository."""
from __future__ import annotations

from datetime import date
from typing import List, Optional, Sequence
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.project.task.models import Task


class MyWorkTasksRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_my_tasks(
        self, employment_id: int, *, status: Optional[str] = None,
        search: Optional[str] = None, limit: int = 20, offset: int = 1
    ) -> Sequence[Task]:
        stmt = select(Task).join(Task.assignee_employment_id == employment_id)
        if status:
            stmt = stmt.where(Task.status == status)
        if search:
            stmt = stmt.where(
                Task.title.ilike(f"%{search}%") |
                Task.description.ilike(f"%{search}%")
            )
        stmt = stmt.order_by(Task.due_date.asc().nulls_last()).limit(limit).offset(offset)
        return await self.scalars(stmt)

    async def count_my_tasks(
        self, employment_id: int, status: Optional[str] = None, search: Optional[str] = None
    ) -> int:
        stmt = select(Task).join(Task.assignee_employment_id == employment_id)
        if status:
            stmt = stmt.where(Task.status == status)
        if search:
            stmt = stmt.where(
                Task.title.ilike(f"%{search}%") |
                Task.description.ilike(f"%{search}%")
            )
        result = await self.conn.execute(select(func.count()).select_from(stmt.subquery()))
        return result.scalar() or 0