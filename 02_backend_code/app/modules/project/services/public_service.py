"""
ProjectPublicService — sole public entry for Projects module.

Exposes create_from_lead for Sales (callable inside Sales TX with commit=False).
GET project returns ProjectDetailResponse (metrics + team summary in one call).
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
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
    ProjectDetailResponse,
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
        from app.modules.workforce.models import Employment

        emp = await self._session.get(Employment, employment_id)
        if emp is None:
            raise NotFoundError(f"{label} not found (id={employment_id})")

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
            team = await self._repo.get_team_by_id(team_id)
            if team is not None:
                team_count = 1
                team_name = team.name
                team_member_count = await self._repo.count_active_members(team.id)
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

    async def _project_response(self, project: Project) -> ProjectDetailResponse:
        return await self._detail_response(project)

    async def _team_response(self, team: Team) -> TeamResponse:
        await self._session.refresh(team)
        return TeamResponse.model_validate(team)

    async def _member_response(self, member: TeamMember) -> TeamMemberResponse:
        await self._session.refresh(member)
        return TeamMemberResponse.model_validate(member)

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
            return await self._project_response(project)

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
        return await self._team_response(team)

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
        return await self._team_response(team)

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
        return await self._member_response(member)

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
        project_name: Optional[str] = None,
        limit: int = 200,
        offset: int = 0,
    ) -> list[TaskResponse]:
        resolved_ids = None
        if project_id is not None:
            project = await self._repo.get_project_by_id(project_id)
            if project is None:
                raise NotFoundError("Project not found")
        elif project_name and project_name.strip():
            resolved_ids = list(await self._repo.find_project_ids_by_name(project_name))
            if not resolved_ids:
                return []

        rows = await self._repo.list_all_tasks(
            project_id=project_id,
            project_ids=resolved_ids,
            limit=limit,
            offset=offset,
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
        await self._session.refresh(task)
        minutes = await self._repo.sum_task_minutes(task.id)
        project_name = None
        try:
            proj = await self._repo.get_project_by_id(task.project_id)
            if proj is not None:
                project_name = proj.project_name
        except Exception:
            pass
        base = TaskResponse.model_validate(task)
        return base.model_copy(
            update={"actual_minutes": minutes, "project_name": project_name}
        )

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
        await self._session.refresh(entry)
        return TimeEntryResponse.model_validate(entry)

    async def list_time_entries(self, task_id: int) -> list[TimeEntryResponse]:
        task = await self._repo.get_task_by_id(task_id)
        if task is None:
            raise NotFoundError("Task not found")
        rows = await self._repo.list_time_entries(task_id)
        return [TimeEntryResponse.model_validate(r) for r in rows]
