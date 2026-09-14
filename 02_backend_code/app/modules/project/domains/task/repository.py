"""TaskRepository — task and time-entry queries."""

from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.project.models import Task, TaskTimeEntry


class TaskRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_task_by_id(self, task_id: int) -> Optional[Task]:
        stmt = select(Task).where(Task.id == task_id)
        return await self.scalar_one_or_none(stmt)

    async def list_tasks(self, project_id: int) -> Sequence[Task]:
        stmt = select(Task).where(Task.project_id == project_id).order_by(Task.id)
        return (await self._session.execute(stmt)).scalars().all()

    async def list_all_tasks(
        self,
        *,
        project_id: Optional[int] = None,
        project_ids: Optional[Sequence[int]] = None,
        limit: int = 200,
        offset: int = 0,
    ) -> Sequence[Task]:
        stmt = select(Task).order_by(Task.id.desc()).limit(limit).offset(offset)
        if project_id is not None:
            stmt = (
                select(Task)
                .where(Task.project_id == project_id)
                .order_by(Task.id.desc())
                .limit(limit)
                .offset(offset)
            )
        elif project_ids is not None:
            if not project_ids:
                return []
            stmt = (
                select(Task)
                .where(Task.project_id.in_(list(project_ids)))
                .order_by(Task.id.desc())
                .limit(limit)
                .offset(offset)
            )
        return (await self._session.execute(stmt)).scalars().all()

    async def sum_task_minutes(self, task_id: int) -> int:
        stmt = select(func.coalesce(func.sum(TaskTimeEntry.duration_minutes), 0)).where(
            TaskTimeEntry.task_id == task_id
        )
        return int((await self._session.execute(stmt)).scalar_one() or 0)

    async def get_time_entry(
        self, task_id: int, employment_id: int, work_date
    ) -> Optional[TaskTimeEntry]:
        stmt = select(TaskTimeEntry).where(
            TaskTimeEntry.task_id == task_id,
            TaskTimeEntry.employment_id == employment_id,
            TaskTimeEntry.work_date == work_date,
        )
        return await self.scalar_one_or_none(stmt)

    async def list_time_entries(self, task_id: int) -> Sequence[TaskTimeEntry]:
        stmt = (
            select(TaskTimeEntry)
            .where(TaskTimeEntry.task_id == task_id)
            .order_by(TaskTimeEntry.work_date.desc())
        )
        return (await self._session.execute(stmt)).scalars().all()
