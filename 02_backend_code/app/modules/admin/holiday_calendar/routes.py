"""Holiday calendar routes."""
from __future__ import annotations
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.admin.holiday_calendar.schemas import (
    HolidayCalendarCreate, HolidayCalendarResponse, HolidayCalendarUpdate,
    HolidayCreate, HolidayResponse, HolidayUpdate, MessageResponse,
)
from app.modules.admin.holiday_calendar.service import HolidayCalendarService

router = APIRouter(prefix="/holiday-calendars", tags=["Admin / Holiday Calendars"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> HolidayCalendarService:
    return HolidayCalendarService(session)

ServiceDep = Annotated[HolidayCalendarService, Depends(get_service)]

@router.post("", response_model=HolidayCalendarResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar(body: HolidayCalendarCreate, service: ServiceDep, actor: ActorHeader = None) -> HolidayCalendarResponse:
    return await service.create(body, actor_employment_id=actor)

@router.get("", response_model=list[HolidayCalendarResponse])
async def list_calendars(service: ServiceDep, include_archived: bool = Query(False)) -> list[HolidayCalendarResponse]:
    return await service.list(include_archived=include_archived)

@router.get("/{calendar_id}", response_model=HolidayCalendarResponse)
async def get_calendar(calendar_id: int, service: ServiceDep) -> HolidayCalendarResponse:
    return await service.get(calendar_id)

@router.patch("/{calendar_id}", response_model=HolidayCalendarResponse)
async def update_calendar(calendar_id: int, body: HolidayCalendarUpdate, service: ServiceDep, actor: ActorHeader = None) -> HolidayCalendarResponse:
    return await service.update(calendar_id, body, actor_employment_id=actor)

@router.post("/{calendar_id}/archive", response_model=MessageResponse)
async def archive_calendar(calendar_id: int, service: ServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive(calendar_id, actor_employment_id=actor)

@router.post("/{calendar_id}/holidays", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
async def add_holiday(calendar_id: int, body: HolidayCreate, service: ServiceDep, actor: ActorHeader = None) -> HolidayResponse:
    return await service.add_holiday(calendar_id, body, actor_employment_id=actor)

@router.get("/{calendar_id}/holidays", response_model=list[HolidayResponse])
async def list_holidays(calendar_id: int, service: ServiceDep) -> list[HolidayResponse]:
    return await service.list_holidays(calendar_id)

@router.patch("/holidays/{holiday_id}", response_model=HolidayResponse)
async def update_holiday(holiday_id: int, body: HolidayUpdate, service: ServiceDep, actor: ActorHeader = None) -> HolidayResponse:
    return await service.update_holiday(holiday_id, body, actor_employment_id=actor)

@router.delete("/holidays/{holiday_id}", response_model=MessageResponse)
async def delete_holiday(holiday_id: int, service: ServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.delete_holiday(holiday_id, actor_employment_id=actor)
