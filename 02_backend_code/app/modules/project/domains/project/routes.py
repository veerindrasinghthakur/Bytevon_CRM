"""Project domain HTTP routes (mounted under /projects)."""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import ProjectAssignmentType
from app.modules.project.dependencies import ProjectServiceDep, TeamServiceDep
from app.modules.project.domains.project.schemas import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.modules.project.domains.team.schemas import TeamResponse

router = APIRouter(tags=["Projects"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


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


@router.get("/{project_id}/teams", response_model=list[TeamResponse])
@router.get("/projects/{project_id}/teams", response_model=list[TeamResponse])
async def list_teams_for_project(
    project_id: int,
    project_service: ProjectServiceDep,
    team_service: TeamServiceDep,
) -> list[TeamResponse]:
    """Return linked team when project.assignment_type == TEAM."""
    project = await project_service.get_project(project_id)
    if project.assignment_type != ProjectAssignmentType.TEAM:
        return []
    try:
        team = await team_service.get_team(project.assigned_to_id)
        return [team]
    except Exception:
        return []


@router.get("/{project_id}", response_model=ProjectDetailResponse)
@router.get("/projects/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: int, service: ProjectServiceDep
) -> ProjectDetailResponse:
    return await service.get_project(project_id)


@router.patch("/{project_id}", response_model=ProjectDetailResponse)
@router.patch("/projects/{project_id}", response_model=ProjectDetailResponse)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    service: ProjectServiceDep,
    actor: ActorHeader = None,
) -> ProjectDetailResponse:
    return await service.update_project(
        project_id, body, actor_employment_id=actor
    )
