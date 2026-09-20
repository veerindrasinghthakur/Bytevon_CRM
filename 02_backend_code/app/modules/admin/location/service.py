"""LocationService."""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.location.models import Location
from app.modules.admin.location.repository import LocationRepository
from app.modules.admin.location.schemas import (
    LocationCreate,
    LocationResponse,
    LocationUpdate,
    MessageResponse,
)

logger = logging.getLogger(__name__)


def _optional_id(value: int | None) -> int | None:
    if value is None or value <= 0:
        return None
    return value


class LocationService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = LocationRepository(session)

    async def _refresh(self, obj: Any) -> Any:
        await self._session.refresh(obj)
        return obj

    async def create(
        self, data: LocationCreate, *, actor_employment_id: int | None = None
    ) -> LocationResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        loc = Location(
            name=data.name.strip(),
            timezone=data.timezone or "Asia/Kolkata",
            working_week_id=_optional_id(data.working_week_id),
            holiday_calendar_id=_optional_id(data.holiday_calendar_id),
            latitude=data.latitude if data.latitude is not None else Decimal("0"),
            longitude=data.longitude if data.longitude is not None else Decimal("0"),
            attendance_radius_meters=data.attendance_radius_meters or 200,
            allowed_ip_cidrs=list(data.allowed_ip_cidrs or []),
            country=data.country or "India",
            state=data.state or "",
            city=data.city or "",
            address=data.address or "",
            payroll_region=data.payroll_region,
            currency=data.currency or "INR",
            fiscal_year_start_month=data.fiscal_year_start_month or 4,
            changed_by=actor,
        )
        await self._repo.add(loc)
        await self._commit()
        await self._audit("location.created", loc.id, actor_employment_id)
        await self._refresh(loc)
        return LocationResponse.model_validate(loc)

    async def get(self, location_id: int) -> LocationResponse:
        loc = await self._repo.get_by_id(location_id, include_archived=True)
        if loc is None:
            raise NotFoundError("Location not found")
        return LocationResponse.model_validate(loc)

    async def list(self, *, include_archived: bool = False) -> list[LocationResponse]:
        rows = await self._repo.list(include_archived=include_archived)
        return [LocationResponse.model_validate(r) for r in rows]

    async def update(
        self,
        location_id: int,
        data: LocationUpdate,
        *,
        actor_employment_id: int | None = None,
    ) -> LocationResponse:
        loc = await self._repo.get_by_id(location_id, include_archived=True)
        if loc is None:
            raise NotFoundError("Location not found")
        if loc.is_archived:
            raise DomainError("Cannot update archived location")
        payload = data.model_dump(exclude_unset=True)
        for field in (
            "name",
            "timezone",
            "country",
            "state",
            "city",
            "address",
            "payroll_region",
            "currency",
            "latitude",
            "longitude",
            "attendance_radius_meters",
            "allowed_ip_cidrs",
            "fiscal_year_start_month",
        ):
            if field in payload and payload[field] is not None:
                val = payload[field]
                if isinstance(val, str):
                    val = val.strip()
                setattr(loc, field, val)
        if "working_week_id" in payload:
            loc.working_week_id = _optional_id(payload["working_week_id"])
        if "holiday_calendar_id" in payload:
            loc.holiday_calendar_id = _optional_id(payload["holiday_calendar_id"])
        loc.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("location.updated", location_id, actor_employment_id)
        await self._refresh(loc)
        return LocationResponse.model_validate(loc)

    async def archive(
        self, location_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        loc = await self._repo.get_by_id(location_id, include_archived=True)
        if loc is None:
            raise NotFoundError("Location not found")
        if loc.is_archived:
            return MessageResponse(message="Location already archived")
        loc.is_archived = True
        loc.archived_at = datetime.now(UTC)
        loc.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("location.archived", location_id, actor_employment_id)
        return MessageResponse(message="Location archived")

    async def delete(
        self, location_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        loc = await self._repo.get_by_id(location_id, include_archived=True)
        if loc is None or bool(getattr(loc, "is_archived", False)):
            raise NotFoundError("Location not found")
        loc.is_archived = True
        loc.archived_at = datetime.now(UTC)
        loc.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("location.deleted", location_id, actor_employment_id)
        return MessageResponse(message="Location deleted")


LocationPublicService = LocationService
