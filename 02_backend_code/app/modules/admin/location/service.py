"""LocationService."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
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


def _optional_id(value: Optional[int]) -> Optional[int]:
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

    async def create(self, data: LocationCreate, *, actor_employment_id: Optional[int] = None) -> LocationResponse:
        existing = await self._repo.get_by_code(data.code)
        if existing:
            raise ConflictError(f"Location code '{data.code}' already exists")
        loc = Location(
            name=data.name.strip(),
            code=data.code.strip().upper(),
            address_line1=data.address_line1,
            address_line2=getattr(data, "address_line2", None),
            city=data.city,
            state=getattr(data, "state", None),
            country=data.country,
            postal_code=getattr(data, "postal_code", None),
            timezone=getattr(data, "timezone", None) or "UTC",
            working_week_id=_optional_id(getattr(data, "working_week_id", None)),
            holiday_calendar_id=_optional_id(getattr(data, "holiday_calendar_id", None)),
            is_head_office=bool(getattr(data, "is_head_office", False)),
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
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
        self, location_id: int, data: LocationUpdate, *, actor_employment_id: Optional[int] = None
    ) -> LocationResponse:
        loc = await self._repo.get_by_id(location_id, include_archived=True)
        if loc is None:
            raise NotFoundError("Location not found")
        if loc.is_archived:
            raise DomainError("Cannot update archived location")
        payload = data.model_dump(exclude_unset=True)
        if "code" in payload and payload["code"] is not None:
            code = payload["code"].strip().upper()
            existing = await self._repo.get_by_code(code)
            if existing and existing.id != location_id:
                raise ConflictError(f"Location code '{code}' already exists")
            loc.code = code
        for field in (
            "name", "address_line1", "address_line2", "city", "state", "country",
            "postal_code", "timezone", "is_head_office",
        ):
            if field in payload and payload[field] is not None:
                setattr(loc, field, payload[field].strip() if isinstance(payload[field], str) else payload[field])
        if "working_week_id" in payload:
            loc.working_week_id = _optional_id(payload["working_week_id"])
        if "holiday_calendar_id" in payload:
            loc.holiday_calendar_id = _optional_id(payload["holiday_calendar_id"])
        loc.updated_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("location.updated", location_id, actor_employment_id)
        await self._refresh(loc)
        return LocationResponse.model_validate(loc)

    async def archive(self, location_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        loc = await self._repo.get_by_id(location_id, include_archived=True)
        if loc is None:
            raise NotFoundError("Location not found")
        if loc.is_archived:
            return MessageResponse(message="Location already archived")
        loc.is_archived = True
        loc.archived_at = datetime.now(timezone.utc)
        loc.updated_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("location.archived", location_id, actor_employment_id)
        return MessageResponse(message="Location archived")


LocationPublicService = LocationService
