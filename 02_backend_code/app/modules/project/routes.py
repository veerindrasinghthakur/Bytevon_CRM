"""
Project HTTP routes (module package: project).

Router prefix: /projects
Frontend expects:
  GET  /api/v1/projects           → list projects
  GET  /api/v1/projects/teams     → list teams
  GET  /api/v1/projects/tasks     → list tasks (optional project_id)
  GET  /api/v1/projects/{id}/teams → teams linked to project
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import ProjectAssignmentType
from app.modules.project.dependencies import ProjectServiceDep
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

router = APIRouter(prefix="/projects", tags=["Projects"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


# ---------------------------------------------------------------------------
# Teams (static paths first)
# ---------------------------------------------------------------------------

@router.post("/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    body: TeamCreate, service: ProjectServiceDep, actor: ActorHeader = None
) -> TeamResponse:
    return await service.create_team(body, actor_employment_id=actor)


@router.get("/teams", response_model=list[TeamResponse])
async def list_teams(service: ProjectServiceDep) -> list[TeamResponse]:
    return await service.list_teams()


@router.get("/teams/{team_id}", response_model=TeamResponse)
async def get_team(team_id: int, service: ProjectServiceDep) -> TeamResponse:
    return await service.get_team(team_id)


@router.patch("/teams/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    body: TeamUpdate,
    service: ProjectServiceDep,
    actor: ActorHeader = None,
) -> TeamResponse:
    return await service.update_team(team_id, body, actor_employment_id=actor)


@router.post(
    "/teams/{team_id}/members",
    response_model=TeamMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_team_member(
    team_id: int,
    body: TeamMemberAdd,
    service: ProjectServiceDep,
    actor: ActorHeader = None,
) -> TeamMemberResponse:
    return await service.add_team_member(team_id, body, actor_employment_id=actor)


@router.delete(
    "/teams/{team_id}/members/{employment_id}",
    response_model=MessageResponse,
)
async def remove_team_member(
    team_id: int,
    employment_id: int,
    service: ProjectServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.remove_team_member(
        team_id, employment_id, actor_employment_id=actor
    )


@router.get(
    "/teams/{team_id}/members",
    response_model=list[TeamMemberResponse],
)
async def list_team_members(
    team_id: int, service: ProjectServiceDep
) -> list[TeamMemberResponse]:
    return await service.list_team_members(team_id)


# ---------------------------------------------------------------------------
# Tasks — static /tasks before /{project_id}
# ---------------------------------------------------------------------------

@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    body: TaskCreate, service: ProjectServiceDep, actor: ActorHeader = None
) -> TaskResponse:
    return await service.create_task(body, actor_employment_id=actor)


@router.get("/tasks", response_model=list[TaskResponse])
async def list_all_tasks(
    service: ProjectServiceDep,
    project_id: Optional[int] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[TaskResponse]:
    return await service.list_all_tasks(
        project_id=project_id, limit=limit, offset=offset
    )


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, service: ProjectServiceDep) -> TaskResponse:
    return await service.get_task(task_id)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    body: TaskUpdate,
    service: ProjectServiceDep,
    actor: ActorHeader = None,
) -> TaskResponse:
    return await service.update_task(task_id, body, actor_employment_id=actor)


# ---------------------------------------------------------------------------
# Time entries
# ---------------------------------------------------------------------------

@router.post(
    "/time-entries",
    response_model=TimeEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_time_entry(
    body: TimeEntryCreate,
    service: ProjectServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
) -> TimeEntryResponse:
    return await service.create_time_entry(body, actor_employment_id=actor)


@router.get(
    "/tasks/{task_id}/time-entries",
    response_model=list[TimeEntryResponse],
)
async def list_time_entries(
    task_id: int, service: ProjectServiceDep
) -> list[TimeEntryResponse]:
    return await service.list_time_entries(task_id)


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate, service: ProjectServiceDep, actor: ActorHeader = None
) -> ProjectResponse:
    return await service.create_project(body, actor_employment_id=actor)


@router.get("", response_model=list[ProjectResponse])
@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    service: ProjectServiceDep,
    client_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[ProjectResponse]:
    return await service.list_projects(
        client_id=client_id, limit=limit, offset=offset
    )


@router.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def create_project_nested(
    body: ProjectCreate, service: ProjectServiceDep, actor: ActorHeader = None
) -> ProjectResponse:
    return await service.create_project(body, actor_employment_id=actor)


@router.get(
    "/projects",
    response_model=list[ProjectResponse],
    include_in_schema=False,
)
async def list_projects_nested(
    service: ProjectServiceDep,
    client_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[ProjectResponse]:
    return await service.list_projects(
        client_id=client_id, limit=limit, offset=offset
    )


@router.get("/projects/{project_id}/tasks", response_model=list[TaskResponse])
async def list_project_tasks(
    project_id: int, service: ProjectServiceDep
) -> list[TaskResponse]:
    return await service.list_tasks(project_id)


@router.get("/{project_id}/teams", response_model=list[TeamResponse])
@router.get("/projects/{project_id}/teams", response_model=list[TeamResponse])
async def list_teams_for_project(
    project_id: int, service: ProjectServiceDep
) -> list[TeamResponse]:
    """Return linked team when project.assignment_type == TEAM."""
    project = await service.get_project(project_id)
    if project.assignment_type != ProjectAssignmentType.TEAM:
        return []
    try:
        team = await service.get_team(project.assigned_to_id)
        return [team]
    except Exception:
        return []


@router.get("/{project_id}", response_model=ProjectResponse)
@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int, service: ProjectServiceDep
) -> ProjectResponse:
    return await service.get_project(project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    service: ProjectServiceDep,
    actor: ActorHeader = None,
) -> ProjectResponse:
    return await service.update_project(
        project_id, body, actor_employment_id=actor
    )
