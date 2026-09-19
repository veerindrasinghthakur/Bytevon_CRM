"""ShiftService."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.shift.models import Shift
from app.modules.admin.shift.repository import ShiftRepository
from app.modules.admin.shift.schemas import (
    MessageResponse,
    ShiftCreate,
    ShiftResponse,
    ShiftUpdate,
)

logger = logging.getLogger(__name__)


class ShiftService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ShiftRepository(session)

    async def _refresh(self, obj: Any) -> Any:
        await self._session.refresh(obj)
        return obj

    async def create(
        self, data: ShiftCreate, *, actor_employment_id: Optional[int] = None
    ) -> ShiftResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        row = Shift(
            name=data.name.strip(),
            start_time=data.start_time,
            end_time=data.end_time,
            is_overnight=bool(getattr(data, "is_overnight", False)),
            grace_late_minutes=int(getattr(data, "grace_late_minutes", 0) or 0),
            flexible_end=bool(getattr(data, "flexible_end", False)),
            break_duration_minutes=getattr(data, "break_duration_minutes", None)
            or getattr(data, "break_minutes", None),
            changed_by=actor,
        )
        await self._repo.add(row)
        await self._commit()
        await self._audit("shift.created", row.id, actor_employment_id)
        await self._refresh(row)
        return ShiftResponse.model_validate(row)

    async def get(self, shift_id: int) -> ShiftResponse:
        row = await self._repo.get_by_id(shift_id, include_archived=True)
        if row is None:
            raise NotFoundError("Shift not found")
        return ShiftResponse.model_validate(row)

    async def list(self, *, include_archived: bool = False) -> list[ShiftResponse]:
        rows = await self._repo.list_all(include_archived=include_archived)
        return [ShiftResponse.model_validate(r) for r in rows]

    async def update(
        self,
        shift_id: int,
        data: ShiftUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> ShiftResponse:
        row = await self._repo.get_by_id(shift_id, include_archived=True)
        if row is None:
            raise NotFoundError("Shift not found")
        if row.is_archived:
            raise DomainError("Cannot update archived shift")
        payload = data.model_dump(exclude_unset=True)
        if "break_minutes" in payload and "break_duration_minutes" not in payload:
            payload["break_duration_minutes"] = payload.pop("break_minutes")
        for field in (
            "name",
            "start_time",
            "end_time",
            "is_overnight",
            "grace_late_minutes",
            "flexible_end",
            "break_duration_minutes",
        ):
            if field in payload and payload[field] is not None:
                val = payload[field]
                if field == "name" and isinstance(val, str):
                    val = val.strip()
                setattr(row, field, val)
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("shift.updated", shift_id, actor_employment_id)
        await self._refresh(row)
        return ShiftResponse.model_validate(row)

    async def archive(
        self, shift_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        row = await self._repo.get_by_id(shift_id, include_archived=True)
        if row is None:
            raise NotFoundError("Shift not found")
        if row.is_archived:
            return MessageResponse(message="Shift already archived")
        row.is_archived = True
        row.archived_at = datetime.now(timezone.utc)
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("shift.archived", shift_id, actor_employment_id)
        return MessageResponse(message="Shift archived")


ShiftPublicService = ShiftService
