"""Compose repository — templates + preferences checks for notify."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationChannel
from app.core.repositories.base_repository import BaseRepository
from app.modules.notifications.models import NotificationPreference, NotificationTemplate


class ComposeRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_template_by_code(self, code: str) -> NotificationTemplate | None:
        stmt = select(NotificationTemplate).where(
            NotificationTemplate.code == code,
            NotificationTemplate.is_active.is_(True),
        )
        return await self.scalar_one_or_none(stmt)

    async def get_preference(
        self, employment_id: int, channel: NotificationChannel
    ) -> NotificationPreference | None:
        stmt = select(NotificationPreference).where(
            NotificationPreference.employment_id == employment_id,
            NotificationPreference.channel == channel,
        )
        return await self.scalar_one_or_none(stmt)

    async def is_channel_enabled(
        self, employment_id: int, channel: NotificationChannel
    ) -> bool:
        pref = await self.get_preference(employment_id, channel)
        if pref is None:
            return True
        return pref.is_enabled
