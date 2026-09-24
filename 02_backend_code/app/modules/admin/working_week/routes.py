"""Working week routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.admin.working_week.schemas import MessageResponse, WorkingWeekCreate, WorkingWeekResponse
from app.modules.admin.working_week.service import WorkingWeekService

router = APIRouter(prefix="/working-weeks", tags=["Admin / Working Weeks"])

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> WorkingWeekService:
    return WorkingWeekService(session)

ServiceDep = Annotated[WorkingWeekService, Depends(get_service)]

@router.post("", response_model=WorkingWeekResponse, status_code=status.HTTP_201_CREATED)
async def create_working_week(body: WorkingWeekCreate, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("shift", "CREATE", "ORGANIZATION"))]) -> WorkingWeekResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)

@router.get("", response_model=list[WorkingWeekResponse], dependencies=[Depends(require_permission("shift", "VIEW", "ORGANIZATION"))])
async def list_working_weeks(service: ServiceDep, include_archived: bool = Query(False)) -> list[WorkingWeekResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/current", response_model=WorkingWeekResponse, dependencies=[Depends(require_permission("shift", "VIEW", "ORGANIZATION"))])
async def get_current_working_week(service: ServiceDep) -> WorkingWeekResponse:
    return await service.get_current()

@router.get("/{working_week_id}", response_model=WorkingWeekResponse, dependencies=[Depends(require_permission("shift", "VIEW", "ORGANIZATION"))])
async def get_working_week(working_week_id: int, service: ServiceDep) -> WorkingWeekResponse:
    return await service.get(working_week_id)

@router.post("/{working_week_id}/archive", response_model=MessageResponse)
async def archive_working_week(working_week_id: int, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("shift", "UPDATE", "ORGANIZATION"))]) -> MessageResponse:
    return await service.archive(working_week_id, actor_employment_id=auth.employment_id)
