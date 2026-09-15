"""Location routes."""
from __future__ import annotations
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.admin.location.schemas import (
    LocationCreate, LocationResponse, LocationUpdate, MessageResponse,
)
from app.modules.admin.location.service import LocationService

router = APIRouter(prefix="/locations", tags=["Admin / Locations"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> LocationService:
    return LocationService(session)

ServiceDep = Annotated[LocationService, Depends(get_service)]

@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(body: LocationCreate, service: ServiceDep, actor: ActorHeader = None) -> LocationResponse:
    return await service.create(body, actor_employment_id=actor)

@router.get("", response_model=list[LocationResponse])
async def list_locations(service: ServiceDep, include_archived: bool = Query(False)) -> list[LocationResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(location_id: int, service: ServiceDep) -> LocationResponse:
    return await service.get(location_id)

@router.patch("/{location_id}", response_model=LocationResponse)
async def update_location(location_id: int, body: LocationUpdate, service: ServiceDep, actor: ActorHeader = None) -> LocationResponse:
    return await service.update(location_id, body, actor_employment_id=actor)

@router.post("/{location_id}/archive", response_model=MessageResponse)
async def archive_location(location_id: int, service: ServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive(location_id, actor_employment_id=actor)
