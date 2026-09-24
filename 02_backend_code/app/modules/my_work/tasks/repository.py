"""My Work Tasks repository — project.task rows for the caller's employment."""
from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import ProjectAssignmentType, ProjectStatus, TaskStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.project.project.models import Project
from app.modules.project.task.models import Task
from app.modules.project.team.models import TeamMember


class MyWorkTasksRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    def _base_stmt(self, employment_id: int, *, status: str | None, search: str | None):
        stmt = (
            select(Task, Project.project_name)
            .join(Project, Project.id == Task.project_id)
            .where(Task.assignee_employment_id == employment_id)
        )
        if status:
            try:
                stmt = stmt.where(Task.status == TaskStatus(status.strip().upper()))
            except ValueError:
                pass
        if search and search.strip():
            stmt = stmt.where(Task.title.ilike(f"%{search.strip()}%"))
        return stmt

    async def list_my_tasks(
        self,
        employment_id: int | None,
        *,
        status: str | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Sequence[tuple[Task, str | None]]:
        if employment_id is None:
            return []
        stmt = (
            self._base_stmt(employment_id, status=status, search=search)
            .order_by(Task.due_date.is_(None), Task.due_date, desc(Task.id))
            .limit(max(1, limit))
            .offset(max(0, offset))
        )
        res = await self.execute(stmt)
        return list(res.all())

    async def count_my_tasks(
        self,
        employment_id: int | None,
        *,
        status: str | None = None,
        search: str | None = None,
    ) -> int:
        if employment_id is None:
            return 0
        stmt = select(func.count()).select_from(
            self._base_stmt(employment_id, status=status, search=search).subquery()
        )
        res = await self.execute(stmt)
        return int(res.scalar() or 0)

    async def list_my_projects(self, employment_id: int) -> Sequence[Project]:
        """ACTIVE projects assigned to me directly or to one of my teams."""
        team_ids = select(TeamMember.team_id).where(
            TeamMember.employment_id == employment_id,
            TeamMember.is_member.is_(True),
        )
        stmt = (
            select(Project)
            .where(
                Project.status == ProjectStatus.ACTIVE,
                (
                    (
                        Project.assignment_type == ProjectAssignmentType.TEAM
                    )
                    & (Project.assigned_to_id.in_(team_ids))
                )
                | (
                    (Project.assignment_type == ProjectAssignmentType.INDIVIDUAL)
                    & (Project.assigned_to_id == employment_id)
                ),
            )
            .order_by(Project.project_name)
        )
        return await self.scalars(stmt)

    async def get_project(self, project_id: int) -> Project | None:
        stmt = select(Project).where(Project.id == project_id)
        return await self.scalar_one_or_none(stmt)
