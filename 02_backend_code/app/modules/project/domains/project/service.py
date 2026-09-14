"""ProjectService — project CRUD + create_from_lead (Sales entry)."""

from __future__ import annotations

import logging
from datetime import date
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import (
    ProjectAssignmentType,
    ProjectPhase,
    ProjectSource,
    ProjectStatus,
)
from app.core.exceptions.exception import ConflictError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.project.domains.project.repository import ProjectRepository
from app.modules.project.domains.project.schemas import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.modules.project.domains.team.repository import TeamRepository
from app.modules.project.models import Project

logger = logging.getLogger(__name__)


class ProjectService(BasePublicService):
    """Public project service (also exposed as ProjectPublicService for Sales)."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ProjectRepository(session)
        self._team_repo = TeamRepository(session)

    async def _employment_display_name(self, employment_id: int) -> Optional[str]:
        from app.modules.workforce.models import Employment

        emp = await self._session.get(Employment, employment_id)
        if emp is None:
            return None
        for attr in ("display_name", "full_name", "name"):
            val = getattr(emp, attr, None)
            if val:
                return str(val)
        code = getattr(emp, "employee_code", None)
        return str(code) if code else f"Employment #{employment_id}"

    async def _client_name(self, client_id: int) -> Optional[str]:
        try:
            from app.modules.sales.models import Client

            client = await self._session.get(Client, client_id)
            if client is None:
                return None
            for attr in ("company_name", "name", "client_name"):
                val = getattr(client, attr, None)
                if val:
                    return str(val)
            return f"Client #{client_id}"
        except Exception:
            return None

    async def _detail_response(self, project: Project) -> ProjectDetailResponse:
        await self._session.refresh(project)
        base = ProjectResponse.model_validate(project)

        task_count, open_tasks = await self._repo.count_project_tasks(project.id)
        progress = 0
        if task_count > 0:
            progress = int(round(100 * (task_count - open_tasks) / task_count))

        days_to_deadline: Optional[int] = None
        if project.planned_end_date is not None:
            days_to_deadline = max(0, (project.planned_end_date - date.today()).days)

        team_id: Optional[int] = None
        team_name: Optional[str] = None
        team_head_name: Optional[str] = None
        team_member_count = 0
        team_count = 0

        if project.assignment_type == ProjectAssignmentType.TEAM:
            team_id = project.assigned_to_id
            team = await self._team_repo.get_team_by_id(team_id)
            if team is not None:
                team_count = 1
                team_name = team.name
                team_member_count = await self._team_repo.count_active_members(team.id)
                team_head_name = await self._employment_display_name(
                    team.team_head_employment_id
                )
        elif project.assignment_type == ProjectAssignmentType.INDIVIDUAL:
            team_head_name = await self._employment_display_name(project.assigned_to_id)

        client_name = await self._client_name(project.client_id)

        return ProjectDetailResponse(
            **base.model_dump(),
            client_name=client_name,
            open_tasks=open_tasks,
            task_count=task_count,
            days_to_deadline=days_to_deadline,
            team_count=team_count,
            team_member_count=team_member_count,
            team_id=team_id,
            team_name=team_name,
            team_head_name=team_head_name,
            progress=progress,
        )

    async def create_from_lead(
        self,
        *,
        lead_id: int,
        client_id: int,
        title: str,
        actor_employment_id: Optional[int] = None,
        assigned_to_id: Optional[int] = None,
        assignment_type: ProjectAssignmentType = ProjectAssignmentType.INDIVIDUAL,
        commit: bool = True,
    ) -> ProjectResponse:
        existing = await self._repo.get_project_by_lead_id(lead_id)
        if existing:
            raise ConflictError(f"Project already exists for lead {lead_id}")

        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        assignee = assigned_to_id or actor

        project = Project(
            client_id=client_id,
            lead_id=lead_id,
            project_name=title,
            assignment_type=assignment_type,
            assigned_to_id=assignee,
            status=ProjectStatus.PLANNED,
            phase=ProjectPhase.INITIAL,
            created_from=ProjectSource.LEAD,
            changed_by=actor,
        )
        await self._repo.add(project)

        if commit:
            await self._commit()
            await self._audit("project.created_from_lead", project.id, actor)
            return await self._detail_response(project)

        await self._flush()
        return ProjectResponse.model_validate(project)

    async def create_project(
        self,
        data: ProjectCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> ProjectDetailResponse:
        if data.lead_id is not None:
            existing = await self._repo.get_project_by_lead_id(data.lead_id)
            if existing:
                raise ConflictError(f"Project already exists for lead {data.lead_id}")

        project = Project(
            client_id=data.client_id,
            lead_id=data.lead_id,
            project_name=data.project_name,
            description=data.description,
            assignment_type=data.assignment_type,
            assigned_to_id=data.assigned_to_id,
            repository_reference=data.repository_reference,
            status=ProjectStatus.PLANNED,
            phase=ProjectPhase.INITIAL,
            created_from=(
                ProjectSource.LEAD if data.lead_id else ProjectSource.MANUAL
            ),
            planned_start_date=data.planned_start_date,
            planned_end_date=data.planned_end_date,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(project)
        await self._commit()
        await self._audit("project.created", project.id, actor_employment_id)
        return await self._detail_response(project)

    async def get_project(self, project_id: int) -> ProjectDetailResponse:
        project = await self._repo.get_project_by_id(project_id)
        if project is None:
            raise NotFoundError("Project not found")
        return await self._detail_response(project)

    async def list_projects(
        self,
        *,
        client_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ProjectResponse]:
        rows = await self._repo.list_projects(
            client_id=client_id, limit=limit, offset=offset
        )
        return [ProjectResponse.model_validate(r) for r in rows]

    async def update_project(
        self,
        project_id: int,
        data: ProjectUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> ProjectDetailResponse:
        project = await self._repo.get_project_by_id(project_id)
        if project is None:
            raise NotFoundError("Project not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(project, field, value)
        project.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("project.updated", project.id, actor_employment_id)
        return await self._detail_response(project)


# Backward-compatible alias for Sales and existing call sites
ProjectPublicService = ProjectService
