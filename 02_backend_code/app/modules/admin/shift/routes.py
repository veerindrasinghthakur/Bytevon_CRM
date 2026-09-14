"""Shift routes."""
from __future__ import annotations
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.admin.shift.schemas import MessageResponse, ShiftCreate, ShiftResponse, ShiftUpdate
from app.modules.admin.shift.service import ShiftService

router = APIRouter(prefix="/shifts", tags=["Admin / Shifts"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> ShiftService:
    return ShiftService(session)

ServiceDep = Annotated[ShiftService, Depends(get_service)]

@router.post("", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def create_shift(body: ShiftCreate, service: ServiceDep, actor: ActorHeader = None) -> ShiftResponse:
    return await service.create(body, actor_employment_id=actor)

@router.get("", response_model=list[ShiftResponse])
async def list_shifts(service: ServiceDep, include_archived: bool = Query(False)) -> list[ShiftResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/{shift_id}", response_model=ShiftResponse)
async def get_shift(shift_id: int, service: ServiceDep) -> ShiftResponse:
    return await service.get(shift_id)

@router.patch("/{shift_id}", response_model=ShiftResponse)
async def update_shift(shift_id: int, body: ShiftUpdate, service: ServiceDep, actor: ActorHeader = None) -> ShiftResponse:
    return await service.update(shift_id, body, actor_employment_id=actor)

@router.post("/{shift_id}/archive", response_model=MessageResponse)
async def archive_shift(shift_id: int, service: ServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive(shift_id, actor_employment_id=actor)
