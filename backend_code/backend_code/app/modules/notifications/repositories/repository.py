"""
NotificationRepository — domain-specific queries only.
"""

from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationChannel, NotificationStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.notifications.models import (
    Notification,
    NotificationPreference,
    NotificationTemplate,
)


class NotificationRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Templates
    # ------------------------------------------------------------------

    async def get_template_by_id(
        self, template_id: int
    ) -> Optional[NotificationTemplate]:
        stmt = select(NotificationTemplate).where(
            NotificationTemplate.id == template_id
        )
        return await self.scalar_one_or_none(stmt)

    async def get_template_by_code(
        self, code: str
    ) -> Optional[NotificationTemplate]:
        stmt = select(NotificationTemplate).where(
            NotificationTemplate.code == code,
            NotificationTemplate.is_active.is_(True),
        )
        return await self.scalar_one_or_none(stmt)

    async def list_templates(
        self, *, active_only: bool = False
    ) -> Sequence[NotificationTemplate]:
        stmt = select(NotificationTemplate).order_by(NotificationTemplate.code)
        if active_only:
            stmt = stmt.where(NotificationTemplate.is_active.is_(True))
        return await self.scalars(stmt)

    # ------------------------------------------------------------------
    # Notifications
    # ------------------------------------------------------------------

    async def get_notification_by_id(
        self, notification_id: int
    ) -> Optional[Notification]:
        stmt = select(Notification).where(Notification.id == notification_id)
        return await self.scalar_one_or_none(stmt)

    async def list_for_recipient(
        self,
        recipient_type: str,
        recipient_id: int,
        *,
        status: Optional[NotificationStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Sequence[Notification]:
        stmt = (
            select(Notification)
            .where(
                Notification.recipient_type == recipient_type,
                Notification.recipient_id == recipient_id,
            )
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if status is not None:
            stmt = stmt.where(Notification.status == status)
        return await self.scalars(stmt)

    async def count_unread(
        self, recipient_type: str, recipient_id: int
    ) -> int:
        from sqlalchemy import func

        stmt = select(func.count()).select_from(Notification).where(
            Notification.recipient_type == recipient_type,
            Notification.recipient_id == recipient_id,
            Notification.status == NotificationStatus.UNREAD,
        )
        result = await self.execute(stmt)
        return int(result.scalar() or 0)

    # ------------------------------------------------------------------
    # Preferences
    # ------------------------------------------------------------------

    async def get_preference(
        self, employment_id: int, channel: NotificationChannel
    ) -> Optional[NotificationPreference]:
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

    async def is_channel_enabled(
        self, employment_id: int, channel: NotificationChannel
    ) -> bool:
        pref = await self.get_preference(employment_id, channel)
        if pref is None:
            # Default: IN_APP enabled, EMAIL enabled unless opted out
            return True
        return pref.is_enabled
