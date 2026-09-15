"""Center (inbox) repository."""
from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.notifications.models import Notification


class CenterRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

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

    async def count_unread(self, recipient_type: str, recipient_id: int) -> int:
        stmt = select(func.count()).select_from(Notification).where(
            Notification.recipient_type == recipient_type,
            Notification.recipient_id == recipient_id,
            Notification.status == NotificationStatus.UNREAD,
        )
        result = await self.execute(stmt)
        return int(result.scalar() or 0)
