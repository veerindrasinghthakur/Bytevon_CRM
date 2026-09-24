"""Team domain HTTP routes (mounted under /projects)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.authorization import AuthContext, require_permission
from app.modules.project.dependencies import TeamServiceDep
from app.modules.project.project.schemas import ProjectResponse
from app.modules.project.team.schemas import (
    MessageResponse,
    TeamCreate,
    TeamMemberAdd,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdate,
)

router = APIRouter(tags=["Teams"])


@router.post("/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    body: TeamCreate, service: TeamServiceDep, auth: Annotated[AuthContext, Depends(require_permission("project", "CREATE", "ORGANIZATION"))]
) -> TeamResponse:
    return await service.create_team(body, actor_employment_id=auth.employment_id)


@router.get("/teams", response_model=list[TeamResponse], dependencies=[Depends(require_permission("project", "VIEW", "ORGANIZATION"))])
async def list_teams(service: TeamServiceDep) -> list[TeamResponse]:
    return await service.list_teams()


@router.get("/teams/{team_id}", response_model=TeamResponse, dependencies=[Depends(require_permission("project", "VIEW", "ORGANIZATION"))])
async def get_team(team_id: int, service: TeamServiceDep) -> TeamResponse:
    return await service.get_team(team_id)


@router.patch("/teams/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    body: TeamUpdate,
    service: TeamServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("project", "UPDATE", "ORGANIZATION"))],
) -> TeamResponse:
    return await service.update_team(team_id, body, actor_employment_id=auth.employment_id)


@router.post(
    "/teams/{team_id}/members",
    response_model=TeamMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_team_member(
    team_id: int,
    body: TeamMemberAdd,
    service: TeamServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("project", "CREATE", "ORGANIZATION"))],
) -> TeamMemberResponse:
    return await service.add_team_member(team_id, body, actor_employment_id=auth.employment_id)


@router.delete(
    "/teams/{team_id}/members/{employment_id}",
    response_model=MessageResponse,
)
async def remove_team_member(
    team_id: int,
    employment_id: int,
    service: TeamServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("project", "DELETE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.remove_team_member(
        team_id, employment_id, actor_employment_id=auth.employment_id
    )


@router.delete(
    "/teams/{team_id}",
    response_model=MessageResponse,
)
async def delete_team(
    team_id: int,
    service: TeamServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("project", "DELETE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.delete_team(team_id, actor_employment_id=auth.employment_id)


@router.get(
    "/teams/{team_id}/projects",
    response_model=list[ProjectResponse],
    dependencies=[Depends(require_permission("project", "VIEW", "ORGANIZATION"))],
)
async def list_projects_for_team(
    team_id: int, service: TeamServiceDep
) -> list[ProjectResponse]:
    return await service.list_projects_for_team(team_id)


@router.get(
    "/teams/{team_id}/members",
    response_model=list[TeamMemberResponse],
    dependencies=[Depends(require_permission("project", "VIEW", "ORGANIZATION"))],
)
async def list_team_members(
    team_id: int, service: TeamServiceDep
) -> list[TeamMemberResponse]:
    return await service.list_team_members(team_id)


@router.get(
    "/teams/{team_id}/members/history",
    response_model=list[TeamMemberResponse],
    dependencies=[Depends(require_permission("project", "VIEW", "ORGANIZATION"))],
)
async def list_member_history(
    team_id: int, service: TeamServiceDep
) -> list[TeamMemberResponse]:
    return await service.list_member_history(team_id)
