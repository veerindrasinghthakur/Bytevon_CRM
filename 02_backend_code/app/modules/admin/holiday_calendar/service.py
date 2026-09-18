"""HolidayCalendarService."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import HolidayType
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.holiday_calendar.models import Holiday, HolidayCalendar
from app.modules.admin.holiday_calendar.repository import HolidayCalendarRepository
from app.modules.admin.holiday_calendar.schemas import (
    HolidayCalendarCreate,
    HolidayCalendarResponse,
    HolidayCalendarUpdate,
    HolidayCreate,
    HolidayResponse,
    HolidayUpdate,
    MessageResponse,
)

logger = logging.getLogger(__name__)


class HolidayCalendarService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = HolidayCalendarRepository(session)

    async def _refresh(self, obj: Any) -> Any:
        await self._session.refresh(obj)
        return obj

    async def create(
        self, data: HolidayCalendarCreate, *, actor_employment_id: Optional[int] = None
    ) -> HolidayCalendarResponse:
        existing = await self._repo.get_by_name(data.name)
        if existing:
            raise ConflictError(f"Holiday calendar '{data.name}' already exists")
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        row = HolidayCalendar(
            name=data.name.strip(),
            created_by=actor,
            changed_by=actor,
        )
        await self._repo.add(row)
        await self._commit()
        await self._audit("holiday_calendar.created", row.id, actor_employment_id)
        await self._refresh(row)
        return HolidayCalendarResponse.model_validate(row)

    async def get(self, calendar_id: int) -> HolidayCalendarResponse:
        row = await self._repo.get_by_id(calendar_id, include_archived=True)
        if row is None:
            raise NotFoundError("Holiday calendar not found")
        return HolidayCalendarResponse.model_validate(row)

    async def list(self, *, include_archived: bool = False) -> list[HolidayCalendarResponse]:
        rows = await self._repo.list(include_archived=include_archived)
        return [HolidayCalendarResponse.model_validate(r) for r in rows]

    async def update(
        self,
        calendar_id: int,
        data: HolidayCalendarUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> HolidayCalendarResponse:
        row = await self._repo.get_by_id(calendar_id, include_archived=True)
        if row is None:
            raise NotFoundError("Holiday calendar not found")
        if row.is_archived:
            raise DomainError("Cannot update archived holiday calendar")
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload and payload["name"] is not None:
            name = payload["name"].strip()
            existing = await self._repo.get_by_name(name)
            if existing and existing.id != calendar_id:
                raise ConflictError(f"Holiday calendar '{name}' already exists")
            row.name = name
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("holiday_calendar.updated", calendar_id, actor_employment_id)
        await self._refresh(row)
        return HolidayCalendarResponse.model_validate(row)

    async def archive(
        self, calendar_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        row = await self._repo.get_by_id(calendar_id, include_archived=True)
        if row is None:
            raise NotFoundError("Holiday calendar not found")
        if row.is_archived:
            return MessageResponse(message="Holiday calendar already archived")
        row.is_archived = True
        row.archived_at = datetime.now(timezone.utc)
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("holiday_calendar.archived", calendar_id, actor_employment_id)
        return MessageResponse(message="Holiday calendar archived")

    async def add_holiday(
        self,
        calendar_id: int,
        data: HolidayCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> HolidayResponse:
        cal = await self._repo.get_by_id(calendar_id, include_archived=False)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        holiday_type = HolidayType.OPTIONAL if data.is_optional else HolidayType.PUBLIC
        h = Holiday(
            holiday_calendar_id=calendar_id,
            name=data.name.strip(),
            date=data.holiday_date,
            holiday_type=holiday_type,
            recurring_flag=bool(data.recurring_flag),
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add_holiday(h)
        await self._commit()
        await self._audit("holiday.created", h.id, actor_employment_id)
        await self._refresh(h)
        return HolidayResponse.model_validate(h)

    async def list_holidays(self, calendar_id: int) -> list[HolidayResponse]:
        cal = await self._repo.get_by_id(calendar_id, include_archived=True)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        rows = await self._repo.list_holidays(calendar_id)
        return [HolidayResponse.model_validate(r) for r in rows]

    async def get_holiday(self, holiday_id: int) -> HolidayResponse:
        row = await self._repo.get_holiday(holiday_id)
        if row is None:
            raise NotFoundError("Holiday not found")
        return HolidayResponse.model_validate(row)

    async def update_holiday(
        self,
        holiday_id: int,
        data: HolidayUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> HolidayResponse:
        row = await self._repo.get_holiday(holiday_id)
        if row is None:
            raise NotFoundError("Holiday not found")
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload and payload["name"] is not None:
            row.name = payload["name"].strip()
        if "holiday_date" in payload and payload["holiday_date"] is not None:
            row.date = payload["holiday_date"]
        if "is_optional" in payload and payload["is_optional"] is not None:
            row.holiday_type = (
                HolidayType.OPTIONAL if payload["is_optional"] else HolidayType.PUBLIC
            )
        if "recurring_flag" in payload and payload["recurring_flag"] is not None:
            row.recurring_flag = payload["recurring_flag"]
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("holiday.updated", holiday_id, actor_employment_id)
        await self._refresh(row)
        return HolidayResponse.model_validate(row)

    async def delete_holiday(
        self, holiday_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        row = await self._repo.get_holiday(holiday_id)
        if row is None:
            raise NotFoundError("Holiday not found")
        await self._repo.delete_holiday(row)
        await self._commit()
        await self._audit("holiday.deleted", holiday_id, actor_employment_id)
        return MessageResponse(message="Holiday deleted")


HolidayCalendarPublicService = HolidayCalendarService
