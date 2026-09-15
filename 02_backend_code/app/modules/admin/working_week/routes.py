"""Working week routes."""
from __future__ import annotations
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.admin.working_week.schemas import MessageResponse, WorkingWeekCreate, WorkingWeekResponse
from app.modules.admin.working_week.service import WorkingWeekService

router = APIRouter(prefix="/working-weeks", tags=["Admin / Working Weeks"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> WorkingWeekService:
    return WorkingWeekService(session)

ServiceDep = Annotated[WorkingWeekService, Depends(get_service)]

@router.post("", response_model=WorkingWeekResponse, status_code=status.HTTP_201_CREATED)
async def create_working_week(body: WorkingWeekCreate, service: ServiceDep, actor: ActorHeader = None) -> WorkingWeekResponse:
    return await service.create(body, actor_employment_id=actor)

@router.get("", response_model=list[WorkingWeekResponse])
async def list_working_weeks(service: ServiceDep, include_archived: bool = Query(False)) -> list[WorkingWeekResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/current", response_model=WorkingWeekResponse)
async def get_current_working_week(service: ServiceDep) -> WorkingWeekResponse:
    return await service.get_current()

@router.get("/{working_week_id}", response_model=WorkingWeekResponse)
async def get_working_week(working_week_id: int, service: ServiceDep) -> WorkingWeekResponse:
    return await service.get(working_week_id)

@router.post("/{working_week_id}/archive", response_model=MessageResponse)
async def archive_working_week(working_week_id: int, service: ServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive(working_week_id, actor_employment_id=actor)
