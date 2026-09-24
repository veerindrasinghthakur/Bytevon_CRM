"""Preference repository."""
from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationChannel
from app.core.repositories.base_repository import BaseRepository
from app.modules.notifications.models import NotificationPreference


class PreferenceRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_preference(
        self, employment_id: int, channel: NotificationChannel
    ) -> NotificationPreference | None:
        stmt = select(NotificationPreference).where(
            NotificationPreference.employment_id == employment_id,
            NotificationPreference.channel == channel,
        )
        return await self.scalar_one_or_none(stmt)

    async def list_preferences(
        self, employment_id: int
    ) -> Sequence[NotificationPreference]:
        stmt = select(NotificationPreference).where(
            NotificationPreference.employment_id == employment_id
        )
        return await self.scalars(stmt)
