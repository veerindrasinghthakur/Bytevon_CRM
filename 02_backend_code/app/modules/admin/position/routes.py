"""Position domain routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.core.database import get_db_session
from app.modules.admin.position.schemas import (
    MessageResponse,
    PositionCreate,
    PositionResponse,
    PositionUpdate,
)
from app.modules.admin.position.service import PositionService

router = APIRouter(prefix="/positions", tags=["Admin / Positions"])

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> PositionService:
    return PositionService(session)

ServiceDep = Annotated[PositionService, Depends(get_service)]

@router.post("", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def create_position(
    body: PositionCreate,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "CREATE", "ORGANIZATION"))],
) -> PositionResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)

@router.get("", response_model=list[PositionResponse], dependencies=[Depends(require_permission("employment", "VIEW", "ORGANIZATION"))])
async def list_positions(service: ServiceDep, include_archived: bool = Query(False)) -> list[PositionResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/{position_id}", response_model=PositionResponse)
async def get_position(
    position_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "CUSTOM"))],
) -> PositionResponse:
    enforce_owner_or_grant(auth, "employment", "VIEW")
    return await service.get(position_id)

@router.patch("/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int,
    body: PositionUpdate,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "CUSTOM"))],
) -> PositionResponse:
    enforce_owner_or_grant(auth, "employment", "UPDATE")
    return await service.update(position_id, body, actor_employment_id=auth.employment_id)

@router.post("/{position_id}/archive", response_model=MessageResponse)
async def archive_position(
    position_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.archive(position_id, actor_employment_id=auth.employment_id)
