"""Shift routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.admin.shift.schemas import MessageResponse, ShiftCreate, ShiftResponse, ShiftUpdate
from app.modules.admin.shift.service import ShiftService

router = APIRouter(prefix="/shifts", tags=["Admin / Shifts"])

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> ShiftService:
    return ShiftService(session)

ServiceDep = Annotated[ShiftService, Depends(get_service)]

@router.post("", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def create_shift(body: ShiftCreate, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("shift", "CREATE", "ORGANIZATION"))]) -> ShiftResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)

@router.get("", response_model=list[ShiftResponse], dependencies=[Depends(require_permission("shift", "VIEW", "ORGANIZATION"))])
async def list_shifts(service: ServiceDep, include_archived: bool = Query(False)) -> list[ShiftResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/{shift_id}/employees", dependencies=[Depends(require_permission("shift", "VIEW", "ORGANIZATION"))])
async def list_shift_employees(
    shift_id: int,
    service: ServiceDep,
) -> list[dict]:
    """Current assignments on this shift (fixes frontend 404 on shift detail)."""
    return await service.list_employees(shift_id)


@router.get("/{shift_id}", response_model=ShiftResponse, dependencies=[Depends(require_permission("shift", "VIEW", "ORGANIZATION"))])
async def get_shift(shift_id: int, service: ServiceDep) -> ShiftResponse:
    return await service.get(shift_id)

@router.patch("/{shift_id}", response_model=ShiftResponse)
async def update_shift(shift_id: int, body: ShiftUpdate, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("shift", "UPDATE", "ORGANIZATION"))]) -> ShiftResponse:
    return await service.update(shift_id, body, actor_employment_id=auth.employment_id)

@router.delete("/{shift_id}", response_model=MessageResponse)
async def delete_shift(shift_id: int, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("shift", "UPDATE", "ORGANIZATION"))]) -> MessageResponse:
    return await service.delete(shift_id, actor_employment_id=auth.employment_id)


# Deprecated alias — old POST .../archive callers keep working
@router.post("/{shift_id}/archive", response_model=MessageResponse, include_in_schema=False)
async def archive_shift(shift_id: int, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("shift", "UPDATE", "ORGANIZATION"))]) -> MessageResponse:
    return await service.delete(shift_id, actor_employment_id=auth.employment_id)

@router.post("/{shift_id}/restore", response_model=ShiftResponse)
async def restore_shift(shift_id: int, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("shift", "UPDATE", "ORGANIZATION"))]) -> ShiftResponse:
    """Q16: restore an archived shift."""
    return await service.restore(shift_id, actor_employment_id=auth.employment_id)
