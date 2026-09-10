"""Holiday calendar / holiday routes — include via organization.routes."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.organization.dependencies import OrganizationServiceDep
from app.modules.organization.schemas.schemas import (
    HolidayCalendarCreate,
    HolidayCalendarResponse,
    HolidayCalendarUpdate,
    HolidayCreate,
    HolidayResponse,
    HolidayUpdate,
    MessageResponse,
)

router = APIRouter(tags=["Organization"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post(
    "/holiday-calendars",
    response_model=HolidayCalendarResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_holiday_calendar(
    body: HolidayCalendarCreate,
    service: OrganizationServiceDep,
    actor: ActorHeader = None,
) -> HolidayCalendarResponse:
    return await service.create_holiday_calendar(body, actor_employment_id=actor)


@router.get("/holiday-calendars", response_model=list[HolidayCalendarResponse])
async def list_holiday_calendars(
    service: OrganizationServiceDep,
    include_archived: bool = Query(False),
) -> list[HolidayCalendarResponse]:
    return await service.list_holiday_calendars(include_archived=include_archived)


@router.get("/holiday-calendars/{calendar_id}", response_model=HolidayCalendarResponse)
async def get_holiday_calendar(
    calendar_id: int,
    service: OrganizationServiceDep,
) -> HolidayCalendarResponse:
    return await service.get_holiday_calendar(calendar_id)


@router.patch("/holiday-calendars/{calendar_id}", response_model=HolidayCalendarResponse)
async def update_holiday_calendar(
    calendar_id: int,
    body: HolidayCalendarUpdate,
    service: OrganizationServiceDep,
    actor: ActorHeader = None,
) -> HolidayCalendarResponse:
    return await service.update_holiday_calendar(
        calendar_id, body, actor_employment_id=actor
    )


@router.post("/holiday-calendars/{calendar_id}/archive", response_model=MessageResponse)
async def archive_holiday_calendar(
    calendar_id: int,
    service: OrganizationServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.archive_holiday_calendar(
        calendar_id, actor_employment_id=actor
    )


@router.post("/holidays", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
async def add_holiday(
    body: HolidayCreate,
    service: OrganizationServiceDep,
    actor: ActorHeader = None,
) -> HolidayResponse:
    return await service.add_holiday(body, actor_employment_id=actor)


@router.get(
    "/holiday-calendars/{calendar_id}/holidays",
    response_model=list[HolidayResponse],
)
async def list_holidays_for_calendar(
    calendar_id: int,
    service: OrganizationServiceDep,
) -> list[HolidayResponse]:
    return await service.list_holidays(calendar_id)


@router.get("/holidays/{holiday_id}", response_model=HolidayResponse)
async def get_holiday(
    holiday_id: int,
    service: OrganizationServiceDep,
) -> HolidayResponse:
    return await service.get_holiday(holiday_id)


@router.patch("/holidays/{holiday_id}", response_model=HolidayResponse)
async def update_holiday(
    holiday_id: int,
    body: HolidayUpdate,
    service: OrganizationServiceDep,
    actor: ActorHeader = None,
) -> HolidayResponse:
    return await service.update_holiday(
        holiday_id, body, actor_employment_id=actor
    )


@router.delete("/holidays/{holiday_id}", response_model=MessageResponse)
async def delete_holiday(
    holiday_id: int,
    service: OrganizationServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.delete_holiday(holiday_id, actor_employment_id=actor)
