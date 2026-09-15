"""Source routes — prefix /sources (+ legacy /platforms)."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.sales.dependencies import SourceServiceDep
from app.modules.sales.source.schemas import (
    MessageResponse,
    SourceCreate,
    SourceResponse,
    SourceUpdate,
)

router = APIRouter(tags=["Sales Sources"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("/sources", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def create_source(
    body: SourceCreate,
    service: SourceServiceDep,
    actor: ActorHeader = None,
) -> SourceResponse:
    return await service.create(body, actor_employment_id=actor)


@router.get("/sources", response_model=list[SourceResponse])
async def list_sources(
    service: SourceServiceDep,
    include_archived: bool = Query(False),
) -> list[SourceResponse]:
    return await service.list(include_archived=include_archived)


@router.get("/sources/{source_id}", response_model=SourceResponse)
async def get_source(source_id: int, service: SourceServiceDep) -> SourceResponse:
    return await service.get(source_id)


@router.patch("/sources/{source_id}", response_model=SourceResponse)
async def update_source(
    source_id: int,
    body: SourceUpdate,
    service: SourceServiceDep,
    actor: ActorHeader = None,
) -> SourceResponse:
    return await service.update(source_id, body, actor_employment_id=actor)


@router.post("/sources/{source_id}/archive", response_model=MessageResponse)
async def archive_source(
    source_id: int,
    service: SourceServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.archive(source_id, actor_employment_id=actor)


# Legacy platform paths
@router.post("/platforms", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def create_platform(body: SourceCreate, service: SourceServiceDep, actor: ActorHeader = None) -> SourceResponse:
    return await service.create(body, actor_employment_id=actor)


@router.get("/platforms", response_model=list[SourceResponse])
async def list_platforms(service: SourceServiceDep, include_archived: bool = Query(False)) -> list[SourceResponse]:
    return await service.list(include_archived=include_archived)
