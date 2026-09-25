"""CenterService — inbox list, read, archive."""
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationRecipientType, NotificationStatus
from app.core.exceptions.exception import NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.notifications.center.repository import CenterRepository
from app.modules.notifications.center.schemas import NotificationResponse


class CenterService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = CenterRepository(session)

    async def list_inbox(
        self,
        employment_id: int,
        *,
        status: NotificationStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[NotificationResponse]:
        rows = await self._repo.list_for_recipient(
            NotificationRecipientType.EMPLOYMENT.value,
            employment_id,
            status=status,
            limit=limit,
            offset=offset,
        )
        return [NotificationResponse.model_validate(r) for r in rows]

    async def unread_count(self, employment_id: int) -> dict[str, int]:
        count = await self._repo.count_unread(
            NotificationRecipientType.EMPLOYMENT.value, employment_id
        )
        return {"unread": count}

    async def get_notification(
        self, notification_id: int, *, employment_id: int
    ) -> NotificationResponse:
        notif = self._owned(
            await self._repo.get_notification_by_id(notification_id), employment_id
        )
        return NotificationResponse.model_validate(notif)

    def _owned(self, notif, employment_id: int):
        if (
            notif is None
            or notif.is_deleted
            or notif.recipient_type != NotificationRecipientType.EMPLOYMENT
            or notif.recipient_id != employment_id
        ):
            raise NotFoundError("Notification not found")
        return notif

    async def mark_read(
        self, notification_id: int, *, employment_id: int
    ) -> NotificationResponse:
        notif = self._owned(
            await self._repo.get_notification_by_id(notification_id), employment_id
        )
        if notif.status == NotificationStatus.UNREAD:
            notif.status = NotificationStatus.READ
            notif.read_at = datetime.now(UTC)
            await self._commit()
        return NotificationResponse.model_validate(notif)

    async def archive(
        self, notification_id: int, *, employment_id: int
    ) -> NotificationResponse:
        notif = self._owned(
            await self._repo.get_notification_by_id(notification_id), employment_id
        )
        notif.status = NotificationStatus.ARCHIVED
        notif.archived_at = datetime.now(UTC)
        if notif.read_at is None:
            notif.read_at = notif.archived_at
        await self._commit()
        return NotificationResponse.model_validate(notif)

    async def soft_delete(
        self, notification_id: int, *, employment_id: int
    ) -> NotificationResponse:
        """Soft-delete (bin) with the same ownership check as read/archive."""
        notif = self._owned(
            await self._repo.get_notification_by_id(notification_id), employment_id
        )
        notif.is_deleted = True
        notif.deleted_at = datetime.now(UTC)
        await self._commit()
        return NotificationResponse.model_validate(notif)
