"""
ProjectPublicService — sole public entry for Projects module.

Exposes create_from_lead for Sales (callable inside Sales TX with commit=False).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import (
    ProjectAssignmentType,
    ProjectPhase,
    ProjectSource,
    ProjectStatus,
    TaskStatus,
)
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.project.models import (
    Project,
    Task,
    TaskTimeEntry,
    Team,
    TeamMember,
)
from app.modules.project.repositories.repository import ProjectRepository
from app.modules.project.schemas.schemas import (
    MessageResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TeamCreate,
    TeamMemberAdd,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdate,
    TimeEntryCreate,
    TimeEntryResponse,
)

logger = logging.getLogger(__name__)


class ProjectPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ProjectRepository(session)

    async def _require_employment(
        self, employment_id: int, *, label: str = "Employment"
    ) -> None:
        """Ensure employment_id exists in employments (FK target for teams/members)."""
        from app.modules.workforce.models import Employment

        emp = await self._session.get(Employment, employment_id)
        if emp is None:
            raise NotFoundError(f"{label} not found (id={employment_id})")

    # ==================================================================
    # create_from_lead (called by Sales inside TX)
    # ==================================================================

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
        else:
            await self._flush()

        return ProjectResponse.model_validate(project)

    # ==================================================================
    # Teams
    # ==================================================================

    async def create_team(
        self,
        data: TeamCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> TeamResponse:
        """Create team and auto-enrol head as active member (role: Team Head)."""
        if not data.name or not str(data.name).strip():
            raise DomainError("Team name is required")

        await self._require_employment(
            data.team_head_employment_id, label="Team head employment"
        )

        team = Team(
            name=str(data.name).strip(),
            team_head_employment_id=data.team_head_employment_id,
            description=data.description,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(team)
        await self._flush()

        existing = await self._repo.get_active_member(
            team.id, data.team_head_employment_id
        )
        if existing is None:
            hist = (
                await self._session.execute(
                    select(TeamMember).where(
                        TeamMember.team_id == team.id,
                        TeamMember.employment_id == data.team_head_employment_id,
                    )
                )
            ).scalar_one_or_none()
            if hist is not None:
                hist.left_at = None
                hist.team_role = "Team Head"
            else:
                await self._repo.add(
                    TeamMember(
                        team_id=team.id,
                        employment_id=data.team_head_employment_id,
                        team_role="Team Head",
                    )
                )

        await self._commit()
        await self._audit("team.created", team.id, actor_employment_id)
        return TeamResponse.model_validate(team)

    async def list_teams(self) -> list[TeamResponse]:
        rows = await self._repo.list_teams()
        return [TeamResponse.model_validate(r) for r in rows]

    async def get_team(self, team_id: int) -> TeamResponse:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        return TeamResponse.model_validate(team)

    async def update_team(
        self,
        team_id: int,
        data: TeamUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> TeamResponse:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        payload = data.model_dump(exclude_unset=True)
        if (
            "team_head_employment_id" in payload
            and payload["team_head_employment_id"] is not None
        ):
            await self._require_employment(
                int(payload["team_head_employment_id"]),
                label="Team head employment",
            )
        for field, value in payload.items():
            setattr(team, field, value)
        team.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("team.updated", team.id, actor_employment_id)
        return TeamResponse.model_validate(team)

    async def add_team_member(
        self,
        team_id: int,
        data: TeamMemberAdd,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> TeamMemberResponse:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        await self._require_employment(data.employment_id, label="Member employment")
        existing = await self._repo.get_active_member(team_id, data.employment_id)
        if existing:
            raise ConflictError("Employment is already an active member of this team")

        hist = (
            await self._session.execute(
                select(TeamMember).where(
                    TeamMember.team_id == team_id,
                    TeamMember.employment_id == data.employment_id,
                )
            )
        ).scalar_one_or_none()
        if hist is not None:
            hist.left_at = None
            hist.team_role = data.team_role
            member = hist
        else:
            member = TeamMember(
                team_id=team_id,
                employment_id=data.employment_id,
                team_role=data.team_role,
            )
            await self._repo.add(member)

        await self._commit()
        await self._audit("team.member_added", team_id, actor_employment_id)
        return TeamMemberResponse.model_validate(member)

    async def remove_team_member(
        self,
        team_id: int,
        employment_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MessageResponse:
        member = await self._repo.get_active_member(team_id, employment_id)
        if member is None:
            raise NotFoundError("Active team membership not found")
        member.left_at = datetime.now(timezone.utc)
        await self._commit()
        await self._audit("team.member_removed", team_id, actor_employment_id)
        return MessageResponse(message="Team member removed")

    async def list_team_members(self, team_id: int) -> list[TeamMemberResponse]:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        rows = await self._repo.list_active_members(team_id)
        return [TeamMemberResponse.model_validate(r) for r in rows]

    # ==================================================================
    # Projects
    # ==================================================================

    async def create_project(
        self,
        data: ProjectCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> ProjectResponse:
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
        return ProjectResponse.model_validate(project)

    async def get_project(self, project_id: int) -> ProjectResponse:
        project = await self._repo.get_project_by_id(project_id)
        if project is None:
            raise NotFoundError("Project not found")
        return ProjectResponse.model_validate(project)

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
    ) -> ProjectResponse:
        project = await self._repo.get_project_by_id(project_id)
        if project is None:
            raise NotFoundError("Project not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(project, field, value)
        project.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("project.updated", project.id, actor_employment_id)
        return ProjectResponse.model_validate(project)

    # ==================================================================
    # Tasks
    # ==================================================================

    async def create_task(
        self,
        data: TaskCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> TaskResponse:
        project = await self._repo.get_project_by_id(data.project_id)
        if project is None:
            raise NotFoundError("Project not found")
        task = Task(
            **data.model_dump(),
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(task)
        await self._commit()
        await self._audit("task.created", task.id, actor_employment_id)
        return await self._task_response(task)

    async def get_task(self, task_id: int) -> TaskResponse:
        task = await self._repo.get_task_by_id(task_id)
        if task is None:
            raise NotFoundError("Task not found")
        return await self._task_response(task)

    async def list_tasks(self, project_id: int) -> list[TaskResponse]:
        project = await self._repo.get_project_by_id(project_id)
        if project is None:
            raise NotFoundError("Project not found")
        rows = await self._repo.list_tasks(project_id)
        return [await self._task_response(t) for t in rows]

    async def list_all_tasks(
        self,
        *,
        project_id: Optional[int] = None,
        limit: int = 200,
        offset: int = 0,
    ) -> list[TaskResponse]:
        if project_id is not None:
            project = await self._repo.get_project_by_id(project_id)
            if project is None:
                raise NotFoundError("Project not found")
        rows = await self._repo.list_all_tasks(
            project_id=project_id, limit=limit, offset=offset
        )
        return [await self._task_response(t) for t in rows]

    async def update_task(
        self,
        task_id: int,
        data: TaskUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> TaskResponse:
        task = await self._repo.get_task_by_id(task_id)
        if task is None:
            raise NotFoundError("Task not found")
        payload = data.model_dump(exclude_unset=True)
        new_status = payload.get("status")
        for field, value in payload.items():
            setattr(task, field, value)
        if new_status == TaskStatus.COMPLETED and task.completed_at is None:
            task.completed_at = datetime.now(timezone.utc)
        elif new_status and new_status != TaskStatus.COMPLETED:
            task.completed_at = None
        task.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("task.updated", task.id, actor_employment_id)
        return await self._task_response(task)

    async def _task_response(self, task: Task) -> TaskResponse:
        minutes = await self._repo.sum_task_minutes(task.id)
        base = TaskResponse.model_validate(task)
        return base.model_copy(update={"actual_minutes": minutes})

    # ==================================================================
    # Time entries (immutable; assignee only)
    # ==================================================================

    async def create_time_entry(
        self,
        data: TimeEntryCreate,
        *,
        actor_employment_id: int,
    ) -> TimeEntryResponse:
        task = await self._repo.get_task_by_id(data.task_id)
        if task is None:
            raise NotFoundError("Task not found")
        if task.assignee_employment_id != actor_employment_id:
            raise DomainError(
                "Only the current task assignee may create time entries"
            )
        existing = await self._repo.get_time_entry(
            data.task_id, actor_employment_id, data.work_date
        )
        if existing:
            raise ConflictError(
                "Time entry already exists for this task, employee, and date"
            )
        entry = TaskTimeEntry(
            task_id=data.task_id,
            employment_id=actor_employment_id,
            work_date=data.work_date,
            duration_minutes=data.duration_minutes,
            description=data.description,
        )
        await self._repo.add(entry)
        await self._commit()
        await self._audit("task_time_entry.created", entry.id, actor_employment_id)
        return TimeEntryResponse.model_validate(entry)

    async def list_time_entries(self, task_id: int) -> list[TimeEntryResponse]:
        task = await self._repo.get_task_by_id(task_id)
        if task is None:
            raise NotFoundError("Task not found")
        rows = await self._repo.list_time_entries(task_id)
        return [TimeEntryResponse.model_validate(r) for r in rows]
