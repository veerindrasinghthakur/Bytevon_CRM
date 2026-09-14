"""Platform domain routes."""
from __future__ import annotations
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.sales.domains.platform.schemas import (
    MessageResponse, PlatformCreate, PlatformResponse, PlatformUpdate,
)
from app.modules.sales.domains.platform.service import PlatformService

router = APIRouter(tags=["Sales / Platforms"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> PlatformService:
    return PlatformService(session)

ServiceDep = Annotated[PlatformService, Depends(get_service)]

@router.post("/platforms", response_model=PlatformResponse, status_code=status.HTTP_201_CREATED)
async def create_platform(body: PlatformCreate, service: ServiceDep, actor: ActorHeader = None) -> PlatformResponse:
    return await service.create(body, actor_employment_id=actor)

@router.get("/platforms", response_model=list[PlatformResponse])
async def list_platforms(service: ServiceDep, include_archived: bool = Query(False)) -> list[PlatformResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/platforms/{platform_id}", response_model=PlatformResponse)
async def get_platform(platform_id: int, service: ServiceDep) -> PlatformResponse:
    return await service.get(platform_id)

@router.patch("/platforms/{platform_id}", response_model=PlatformResponse)
async def update_platform(platform_id: int, body: PlatformUpdate, service: ServiceDep, actor: ActorHeader = None) -> PlatformResponse:
    return await service.update(platform_id, body, actor_employment_id=actor)

@router.post("/platforms/{platform_id}/archive", response_model=MessageResponse)
async def archive_platform(platform_id: int, service: ServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive(platform_id, actor_employment_id=actor)
