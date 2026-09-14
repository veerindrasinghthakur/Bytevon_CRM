"""Team domain HTTP routes (mounted under /projects)."""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, status

from app.modules.project.dependencies import TeamServiceDep
from app.modules.project.domains.team.schemas import (
    MessageResponse,
    TeamCreate,
    TeamMemberAdd,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdate,
)

router = APIRouter(tags=["Teams"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    body: TeamCreate, service: TeamServiceDep, actor: ActorHeader = None
) -> TeamResponse:
    return await service.create_team(body, actor_employment_id=actor)


@router.get("/teams", response_model=list[TeamResponse])
async def list_teams(service: TeamServiceDep) -> list[TeamResponse]:
    return await service.list_teams()


@router.get("/teams/{team_id}", response_model=TeamResponse)
async def get_team(team_id: int, service: TeamServiceDep) -> TeamResponse:
    return await service.get_team(team_id)


@router.patch("/teams/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    body: TeamUpdate,
    service: TeamServiceDep,
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
    service: TeamServiceDep,
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
    service: TeamServiceDep,
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
    team_id: int, service: TeamServiceDep
) -> list[TeamMemberResponse]:
    return await service.list_team_members(team_id)
