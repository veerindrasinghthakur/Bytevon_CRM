"""ProjectRepository — project entity queries."""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import ProjectAssignmentType, TaskStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.project.project.models import Project
from app.modules.project.task.models import Task


class ProjectRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_project_by_id(self, project_id: int) -> Project | None:
        stmt = select(Project).where(Project.id == project_id)
        return await self.scalar_one_or_none(stmt)

    async def get_project_by_lead_id(self, lead_id: int) -> Project | None:
        stmt = select(Project).where(Project.lead_id == lead_id)
        return await self.scalar_one_or_none(stmt)

    async def list_projects(
        self,
        *,
        client_id: int | None = None,
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

    async def list_projects_for_team(self, team_id: int) -> Sequence[Project]:
        """Projects with assignment_type TEAM assigned to the given team."""
        stmt = (
            select(Project)
            .where(
                Project.assignment_type == ProjectAssignmentType.TEAM,
                Project.assigned_to_id == team_id,
            )
            .order_by(Project.id.desc())
        )
        return (await self._session.execute(stmt)).scalars().all()

    async def count_projects_for_team(self, team_id: int) -> int:
        stmt = (
            select(func.count())
            .select_from(Project)
            .where(
                Project.assignment_type == ProjectAssignmentType.TEAM,
                Project.assigned_to_id == team_id,
            )
        )
        return int((await self._session.execute(stmt)).scalar_one() or 0)

    async def find_project_ids_by_name(self, name: str) -> Sequence[int]:
        q = f"%{name.strip()}%"
        stmt = select(Project.id).where(Project.project_name.ilike(q))
        return (await self._session.execute(stmt)).scalars().all()

    async def count_project_tasks(self, project_id: int) -> tuple[int, int]:
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
