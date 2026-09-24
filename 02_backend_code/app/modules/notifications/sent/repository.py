"""Sent repository — outbound history sourced from EMAIL-channel notifications."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationChannel
from app.core.repositories.base_repository import BaseRepository
from app.modules.notifications.models import Notification


class SentRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def count_email_notifications(self) -> int:
        stmt = select(func.count()).select_from(Notification).where(
            Notification.channel == NotificationChannel.EMAIL
        )
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    async def list_email_notifications(
        self, *, skip: int = 0, limit: int = 20
    ) -> list[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.channel == NotificationChannel.EMAIL)
            .order_by(Notification.id.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
