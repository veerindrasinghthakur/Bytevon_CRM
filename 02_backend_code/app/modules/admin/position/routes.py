"""Position domain routes."""
from __future__ import annotations
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.admin.position.schemas import (
    MessageResponse, PositionCreate, PositionResponse, PositionUpdate,
)
from app.modules.admin.position.service import PositionService

router = APIRouter(prefix="/positions", tags=["Admin / Positions"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> PositionService:
    return PositionService(session)

ServiceDep = Annotated[PositionService, Depends(get_service)]

@router.post("", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def create_position(body: PositionCreate, service: ServiceDep, actor: ActorHeader = None) -> PositionResponse:
    return await service.create(body, actor_employment_id=actor)

@router.get("", response_model=list[PositionResponse])
async def list_positions(service: ServiceDep, include_archived: bool = Query(False)) -> list[PositionResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/{position_id}", response_model=PositionResponse)
async def get_position(position_id: int, service: ServiceDep) -> PositionResponse:
    return await service.get(position_id)

@router.patch("/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int, body: PositionUpdate, service: ServiceDep, actor: ActorHeader = None
) -> PositionResponse:
    return await service.update(position_id, body, actor_employment_id=actor)

@router.post("/{position_id}/archive", response_model=MessageResponse)
async def archive_position(
    position_id: int, service: ServiceDep, actor: ActorHeader = None
) -> MessageResponse:
    return await service.archive(position_id, actor_employment_id=actor)
