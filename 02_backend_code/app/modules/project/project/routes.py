"""Project domain HTTP routes (mounted under /projects)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.core.db.enums import ProjectAssignmentType
from app.modules.project.dependencies import ProjectServiceDep, TeamServiceDep
from app.modules.project.project.schemas import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.modules.project.team.schemas import TeamResponse

router = APIRouter(tags=["Projects"])


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate, service: ProjectServiceDep, auth: Annotated[AuthContext, Depends(require_permission("project", "CREATE", "ORGANIZATION"))]
) -> ProjectResponse:
    return await service.create_project(body, actor_employment_id=auth.employment_id)


@router.get("/", response_model=list[ProjectResponse], dependencies=[Depends(require_permission("project", "VIEW", "ORGANIZATION"))])
async def list_projects(
    service: ProjectServiceDep,
    client_id: int | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[ProjectResponse]:
    return await service.list_projects(
        client_id=client_id, limit=limit, offset=offset
    )


@router.get("/{project_id}/teams", response_model=list[TeamResponse], dependencies=[Depends(require_permission("project", "VIEW", "ORGANIZATION"))])
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


@router.get("/{project_id}", response_model=ProjectDetailResponse, dependencies=[Depends(require_permission("project", "VIEW", "ORGANIZATION"))])
async def get_project(
    project_id: int, service: ProjectServiceDep
) -> ProjectDetailResponse:
    return await service.get_project(project_id)


@router.patch("/{project_id}", response_model=ProjectDetailResponse)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    service: ProjectServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("project", "UPDATE", "ORGANIZATION"))],
) -> ProjectDetailResponse:
    return await service.update_project(
        project_id, body, actor_employment_id=auth.employment_id
    )
