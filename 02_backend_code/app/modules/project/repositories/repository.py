"""
ProjectRepository — domain-specific queries only.
"""

from __future__ import annotations

from typing import Optional, Sequence, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import TaskStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.project.models import (
    Project,
    Task,
    TaskTimeEntry,
    Team,
    TeamMember,
)


class ProjectRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # Teams
    async def get_team_by_id(self, team_id: int) -> Optional[Team]:
        stmt = select(Team).where(Team.id == team_id)
        return await self.scalar_one_or_none(stmt)

    async def list_teams(self) -> Sequence[Team]:
        stmt = select(Team).order_by(Team.name)
        return (await self._session.execute(stmt)).scalars().all()

    async def get_active_member(
        self, team_id: int, employment_id: int
    ) -> Optional[TeamMember]:
        stmt = select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.employment_id == employment_id,
            TeamMember.left_at.is_(None),
        )
        return await self.scalar_one_or_none(stmt)

    async def list_active_members(self, team_id: int) -> Sequence[TeamMember]:
        stmt = select(TeamMember).where(
            TeamMember.team_id == team_id, TeamMember.left_at.is_(None)
        )
        return (await self._session.execute(stmt)).scalars().all()

    async def count_active_members(self, team_id: int) -> int:
        stmt = select(func.count()).select_from(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.left_at.is_(None),
        )
        return int((await self._session.execute(stmt)).scalar_one() or 0)

    # Projects
    async def get_project_by_id(self, project_id: int) -> Optional[Project]:
        stmt = select(Project).where(Project.id == project_id)
        return await self.scalar_one_or_none(stmt)

    async def get_project_by_lead_id(self, lead_id: int) -> Optional[Project]:
        stmt = select(Project).where(Project.lead_id == lead_id)
        return await self.scalar_one_or_none(stmt)

    async def list_projects(
        self,
        *,
        client_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Project]:
        stmt = select(Project).order_by(Project.id.desc()).limit(limit).offset(offset)
        if client_id is not None:
            stmt = (
                select(Project)
                .where(Project.client_id == client_id)
                .order_by(Project.id.desc())
                .limit(limit)
                .offset(offset)
            )
        return (await self._session.execute(stmt)).scalars().all()

    async def find_project_ids_by_name(self, name: str) -> Sequence[int]:
        q = f"%{name.strip()}%"
        stmt = select(Project.id).where(Project.project_name.ilike(q))
        return (await self._session.execute(stmt)).scalars().all()

    # Tasks
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

    async def count_project_tasks(self, project_id: int) -> Tuple[int, int]:
        """Return (total, open) where open = not COMPLETED."""
        total_stmt = select(func.count()).select_from(Task).where(
            Task.project_id == project_id
        )
        open_stmt = (
            select(func.count())
            .select_from(Task)
            .where(
                Task.project_id == project_id,
                Task.status != TaskStatus.COMPLETED,
            )
        )
        total = int((await self._session.execute(total_stmt)).scalar_one() or 0)
        open_count = int((await self._session.execute(open_stmt)).scalar_one() or 0)
        return total, open_count

    async def sum_task_minutes(self, task_id: int) -> int:
        stmt = select(func.coalesce(func.sum(TaskTimeEntry.duration_minutes), 0)).where(
            TaskTimeEntry.task_id == task_id
        )
        return int((await self._session.execute(stmt)).scalar_one() or 0)

    # Time entries
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
