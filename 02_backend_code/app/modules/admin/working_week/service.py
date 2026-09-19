"""WorkingWeekService — versioned config via effective dating."""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.working_week.models import WorkingWeek
from app.modules.admin.working_week.repository import WorkingWeekRepository
from app.modules.admin.working_week.schemas import (
    MessageResponse,
    WorkingWeekCreate,
    WorkingWeekResponse,
)

logger = logging.getLogger(__name__)


def _normalize_days(days: list[int]) -> list[int]:
    """ISO weekday 1=Mon .. 7=Sun; keep unique sorted."""
    cleaned = sorted({int(d) for d in days if 1 <= int(d) <= 7})
    if not cleaned:
        raise DomainError("working_days_of_week must include at least one day (1–7)")
    return cleaned


class WorkingWeekService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = WorkingWeekRepository(session)

    async def _refresh(self, obj: Any) -> Any:
        await self._session.refresh(obj)
        return obj

    async def create(
        self, data: WorkingWeekCreate, *, actor_employment_id: Optional[int] = None
    ) -> WorkingWeekResponse:
        days = _normalize_days(list(data.working_days_of_week))
        # Close previous open version the day before the new one starts
        current = await self._repo.get_current(as_of=data.effective_from)
        if current is not None and current.effective_to is None:
            close_on = data.effective_from - timedelta(days=1)
            if close_on >= current.effective_from:
                await self._repo.close(current.id, close_on)

        row = WorkingWeek(
            name=data.name.strip(),
            working_days_of_week=days,
            effective_from=data.effective_from,
            effective_to=None,
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(row)
        await self._commit()
        await self._audit("working_week.created", row.id, actor_employment_id)
        await self._refresh(row)
        return WorkingWeekResponse.model_validate(row)

    async def get(self, working_week_id: int) -> WorkingWeekResponse:
        row = await self._repo.get_by_id(working_week_id)
        if row is None:
            raise NotFoundError("Working week not found")
        return WorkingWeekResponse.model_validate(row)

    async def get_current(self, on_date: Optional[date] = None) -> WorkingWeekResponse:
        row = await self._repo.get_current(as_of=on_date or date.today())
        if row is None:
            raise NotFoundError("No current working week")
        return WorkingWeekResponse.model_validate(row)

    async def list(self, *, include_archived: bool = False) -> list[WorkingWeekResponse]:
        # Versioned model has no is_archived; include_archived ignored
        _ = include_archived
        rows = await self._repo.list_all()
        return [WorkingWeekResponse.model_validate(r) for r in rows]

    async def archive(
        self, working_week_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        """Close the version (set effective_to = today)."""
        row = await self._repo.get_by_id(working_week_id)
        if row is None:
            raise NotFoundError("Working week not found")
        if row.effective_to is not None:
            return MessageResponse(message="Working week already closed")
        today = date.today()
        await self._repo.close(working_week_id, today)
        await self._commit()
        await self._audit("working_week.archived", working_week_id, actor_employment_id)
        return MessageResponse(message="Working week closed")


WorkingWeekPublicService = WorkingWeekService
