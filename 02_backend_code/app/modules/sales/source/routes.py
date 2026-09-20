"""Source routes — prefix /sources (+ legacy /platforms). Soft-delete via DELETE."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.modules.sales.dependencies import SourceServiceDep
from app.modules.sales.source.schemas import (
    MessageResponse,
    SourceCreate,
    SourceListResponse,
    SourceResponse,
    SourceUpdate,
)

router = APIRouter(tags=["Sales Sources"])


@router.post("/sources", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def create_source(
    body: SourceCreate,
    service: SourceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("client", "CREATE", "ORGANIZATION"))],
) -> SourceResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)


@router.get("/sources", response_model=SourceListResponse, dependencies=[Depends(require_permission("client", "VIEW", "ORGANIZATION"))])
async def list_sources(
    service: SourceServiceDep,
    include_archived: bool = Query(False),
    include_deleted: bool = Query(False),
) -> SourceListResponse:
    return await service.list(include_archived=include_archived, include_deleted=include_deleted)


@router.get("/sources/{source_id}", response_model=SourceResponse, dependencies=[Depends(require_permission("client", "VIEW", "ORGANIZATION"))])
async def get_source(source_id: int, service: SourceServiceDep) -> SourceResponse:
    return await service.get(source_id)


@router.patch("/sources/{source_id}", response_model=SourceResponse)
async def update_source(
    source_id: int,
    body: SourceUpdate,
    service: SourceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("client", "UPDATE", "ORGANIZATION"))],
) -> SourceResponse:
    return await service.update(source_id, body, actor_employment_id=auth.employment_id)


@router.delete("/sources/{source_id}", response_model=MessageResponse)
async def delete_source(
    source_id: int,
    service: SourceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("client", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.delete(source_id, actor_employment_id=auth.employment_id)


# Deprecated alias — old POST .../archive clients keep working
@router.post("/sources/{source_id}/archive", response_model=MessageResponse, include_in_schema=False)
async def archive_source_alias(
    source_id: int,
    service: SourceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("client", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.delete(source_id, actor_employment_id=auth.employment_id)


# Legacy platform paths
@router.post("/platforms", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def create_platform(body: SourceCreate, service: SourceServiceDep, auth: Annotated[AuthContext, Depends(require_permission("client", "CREATE", "ORGANIZATION"))]) -> SourceResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)


@router.get("/platforms", response_model=SourceListResponse, dependencies=[Depends(require_permission("client", "VIEW", "ORGANIZATION"))])
async def list_platforms(
    service: SourceServiceDep,
    include_archived: bool = Query(False),
    include_deleted: bool = Query(False),
) -> SourceListResponse:
    return await service.list(include_archived=include_archived, include_deleted=include_deleted)


@router.delete("/platforms/{source_id}", response_model=MessageResponse, include_in_schema=False)
async def delete_platform(
    source_id: int,
    service: SourceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("client", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.delete(source_id, actor_employment_id=auth.employment_id)
