"""Location routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.admin.location.schemas import (
    LocationCreate,
    LocationResponse,
    LocationUpdate,
    MessageResponse,
)
from app.modules.admin.location.service import LocationService

router = APIRouter(prefix="/locations", tags=["Admin / Locations"])

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> LocationService:
    return LocationService(session)

ServiceDep = Annotated[LocationService, Depends(get_service)]

@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(body: LocationCreate, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("location", "CREATE", "ORGANIZATION"))]) -> LocationResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)

@router.get("", response_model=list[LocationResponse], dependencies=[Depends(require_permission("location", "VIEW", "ORGANIZATION"))])
async def list_locations(service: ServiceDep, include_archived: bool = Query(False)) -> list[LocationResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/{location_id}", response_model=LocationResponse, dependencies=[Depends(require_permission("location", "VIEW", "ORGANIZATION"))])
async def get_location(location_id: int, service: ServiceDep) -> LocationResponse:
    return await service.get(location_id)

@router.patch("/{location_id}", response_model=LocationResponse)
async def update_location(location_id: int, body: LocationUpdate, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("location", "UPDATE", "ORGANIZATION"))]) -> LocationResponse:
    return await service.update(location_id, body, actor_employment_id=auth.employment_id)

@router.delete("/{location_id}", response_model=MessageResponse)
async def delete_location(location_id: int, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("location", "UPDATE", "ORGANIZATION"))]) -> MessageResponse:
    return await service.delete(location_id, actor_employment_id=auth.employment_id)


# Deprecated alias — old POST .../archive callers keep working
@router.post("/{location_id}/archive", response_model=MessageResponse, include_in_schema=False)
async def archive_location(location_id: int, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("location", "UPDATE", "ORGANIZATION"))]) -> MessageResponse:
    return await service.delete(location_id, actor_employment_id=auth.employment_id)

@router.post("/{location_id}/restore", response_model=LocationResponse)
async def restore_location(location_id: int, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("location", "UPDATE", "ORGANIZATION"))]) -> LocationResponse:
    """Q16: restore an archived location."""
    return await service.restore(location_id, actor_employment_id=auth.employment_id)
