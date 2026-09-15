"""Shim — NotificationPublicService facade for cross-module notify()."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationStatus
from app.modules.notifications.center.service import CenterService
from app.modules.notifications.compose.schemas import (
    NotificationResponse,
    NotifyBulkRequest,
    NotifyRequest,
)
from app.modules.notifications.compose.service import ComposeService
from app.modules.notifications.preference.schemas import (
    PreferenceResponse,
    PreferenceUpdate,
)
from app.modules.notifications.preference.service import PreferenceService
from app.modules.notifications.template.schemas import (
    NotificationTemplateCreate,
    NotificationTemplateResponse,
    NotificationTemplateUpdate,
)
from app.modules.notifications.template.service import TemplateService

__all__ = ["NotificationPublicService"]


class NotificationPublicService:
    """Facade combining domain services for external callers."""

    def __init__(self, session: AsyncSession) -> None:
        self._compose = ComposeService(session)
        self._center = CenterService(session)
        self._template = TemplateService(session)
        self._preference = PreferenceService(session)

    async def notify(self, data: NotifyRequest) -> Optional[NotificationResponse]:
        return await self._compose.notify(data)

    async def notify_bulk(
        self, data: NotifyBulkRequest
    ) -> list[NotificationResponse]:
        return await self._compose.notify_bulk(data)

    async def create_template(
        self,
        data: NotificationTemplateCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> NotificationTemplateResponse:
        return await self._template.create_template(
            data, actor_employment_id=actor_employment_id
        )

    async def update_template(
        self,
        template_id: int,
        data: NotificationTemplateUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> NotificationTemplateResponse:
        return await self._template.update_template(
            template_id, data, actor_employment_id=actor_employment_id
        )

    async def list_templates(
        self, *, active_only: bool = False
    ) -> list[NotificationTemplateResponse]:
        return await self._template.list_templates(active_only=active_only)

    async def get_template(self, template_id: int) -> NotificationTemplateResponse:
        return await self._template.get_template(template_id)

    async def list_inbox(
        self,
        employment_id: int,
        *,
        status: Optional[NotificationStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[NotificationResponse]:
        return await self._center.list_inbox(
            employment_id, status=status, limit=limit, offset=offset
        )

    async def unread_count(self, employment_id: int) -> dict[str, int]:
        return await self._center.unread_count(employment_id)

    async def mark_read(
        self, notification_id: int, *, employment_id: int
    ) -> NotificationResponse:
        return await self._center.mark_read(
            notification_id, employment_id=employment_id
        )

    async def archive(
        self, notification_id: int, *, employment_id: int
    ) -> NotificationResponse:
        return await self._center.archive(
            notification_id, employment_id=employment_id
        )

    async def list_preferences(
        self, employment_id: int
    ) -> list[PreferenceResponse]:
        return await self._preference.list_preferences(employment_id)

    async def set_preference(
        self, employment_id: int, data: PreferenceUpdate
    ) -> PreferenceResponse:
        return await self._preference.set_preference(employment_id, data)
