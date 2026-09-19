"""WorkingWeekService."""
from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.working_week.models import WorkingWeek
from app.modules.admin.working_week.repository import WorkingWeekRepository
from app.modules.admin.working_week.schemas import (
    MessageResponse,
    WorkingWeekCreate,
    WorkingWeekResponse,
)

logger = logging.getLogger(__name__)


class WorkingWeekService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = WorkingWeekRepository(session)

    async def _refresh(self, obj: Any) -> Any:
        await self._session.refresh(obj)
        return obj

    async def create(self, data: WorkingWeekCreate, *, actor_employment_id: Optional[int] = None) -> WorkingWeekResponse:
        # Auto-close the previous open working week before creating a new one
        current = await self._repo.get_current(on_date=data.effective_from)
        if current and not current.is_archived:
            await self.archive(current.id, actor_employment_id=actor_employment_id)

        row = WorkingWeek(
            name=data.name.strip(),
            effective_from=data.effective_from,
            monday=bool(getattr(data, "monday", True)),
            tuesday=bool(getattr(data, "tuesday", True)),
            wednesday=bool(getattr(data, "wednesday", True)),
            thursday=bool(getattr(data, "thursday", True)),
            friday=bool(getattr(data, "friday", True)),
            saturday=bool(getattr(data, "saturday", False)),
            sunday=bool(getattr(data, "sunday", False)),
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(row)
        await self._commit()
        await self._audit("working_week.created", row.id, actor_employment_id)
        await self._refresh(row)
        return WorkingWeekResponse.model_validate(row)

    async def get(self, working_week_id: int) -> WorkingWeekResponse:
        row = await self._repo.get_by_id(working_week_id, include_archived=True)
        if row is None:
            raise NotFoundError("Working week not found")
        return WorkingWeekResponse.model_validate(row)

    async def get_current(self, on_date: Optional[date] = None) -> WorkingWeekResponse:
        row = await self._repo.get_current(on_date=on_date or date.today())
        if row is None:
            raise NotFoundError("No current working week")
        return WorkingWeekResponse.model_validate(row)

    async def list(self, *, include_archived: bool = False) -> list[WorkingWeekResponse]:
        rows = await self._repo.list(include_archived=include_archived)
        return [WorkingWeekResponse.model_validate(r) for r in rows]

    async def archive(self, working_week_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        row = await self._repo.get_by_id(working_week_id, include_archived=True)
        if row is None:
            raise NotFoundError("Working week not found")
        if row.is_archived:
            return MessageResponse(message="Working week already archived")
        row.is_archived = True
        row.archived_at = datetime.now(timezone.utc)
        row.updated_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("working_week.archived", working_week_id, actor_employment_id)
        return MessageResponse(message="Working week archived")


WorkingWeekPublicService = WorkingWeekService
