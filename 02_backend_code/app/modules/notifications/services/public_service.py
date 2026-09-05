"""
NotificationPublicService — only public entry point for Notifications.

Locked rules:
- Only this service may write notification tables.
- Always called AFTER successful business commit (best-effort).
- Respects preferences.
- V1: IN_APP (+ EMAIL optional enqueue; actual send is lean/stub).
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import (
    NotificationChannel,
    NotificationRecipientType,
    NotificationStatus,
)
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.notifications.models import (
    Notification,
    NotificationPreference,
    NotificationTemplate,
)
from app.modules.notifications.repositories.repository import NotificationRepository
from app.modules.notifications.schemas.schemas import (
    MessageResponse,
    NotificationResponse,
    NotificationTemplateCreate,
    NotificationTemplateResponse,
    NotificationTemplateUpdate,
    NotifyBulkRequest,
    NotifyRequest,
    PreferenceResponse,
    PreferenceUpdate,
)

logger = logging.getLogger(__name__)

_TEMPLATE_VAR = re.compile(r"\{\{\s*(\w+)\s*\}\}")


def _render(template: str, payload: dict[str, Any]) -> str:
    def repl(match: re.Match) -> str:
        key = match.group(1)
        return str(payload.get(key, match.group(0)))

    return _TEMPLATE_VAR.sub(repl, template)


class NotificationPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = NotificationRepository(session)

    # ==================================================================
    # Templates
    # ==================================================================

    async def create_template(
        self,
        data: NotificationTemplateCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> NotificationTemplateResponse:
        existing = await self._repo.get_template_by_code(data.code)
        if existing:
            raise ConflictError(f"Template code '{data.code}' already exists")

        tpl = NotificationTemplate(
            code=data.code,
            title_template=data.title_template,
            body_template=data.body_template,
            variables=data.variables,
            is_active=data.is_active,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(tpl)
        await self._commit()
        return NotificationTemplateResponse.model_validate(tpl)

    async def update_template(
        self,
        template_id: int,
        data: NotificationTemplateUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> NotificationTemplateResponse:
        tpl = await self._repo.get_template_by_id(template_id)
        if tpl is None:
            raise NotFoundError("Template not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(tpl, field, value)
        tpl.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        return NotificationTemplateResponse.model_validate(tpl)

    async def list_templates(
        self, *, active_only: bool = False
    ) -> list[NotificationTemplateResponse]:
        rows = await self._repo.list_templates(active_only=active_only)
        return [NotificationTemplateResponse.model_validate(r) for r in rows]

    async def get_template(self, template_id: int) -> NotificationTemplateResponse:
        tpl = await self._repo.get_template_by_id(template_id)
        if tpl is None:
            raise NotFoundError("Template not found")
        return NotificationTemplateResponse.model_validate(tpl)

    # ==================================================================
    # Notify (post-commit entry from other modules)
    # ==================================================================

    async def notify(self, data: NotifyRequest) -> Optional[NotificationResponse]:
        """
        Create a single notification. Respects preferences for EMPLOYMENT recipients.
        Returns None if channel is disabled for the recipient (preference opt-out).
        Failures are logged; callers should treat this as best-effort.
        """
        try:
            if data.recipient_type == NotificationRecipientType.EMPLOYMENT:
                enabled = await self._repo.is_channel_enabled(
                    data.recipient_id, data.channel
                )
                if not enabled:
                    logger.info(
                        "Notification skipped (preference) employment=%s channel=%s",
                        data.recipient_id,
                        data.channel.value,
                    )
                    return None

            title, body, template_id = await self._resolve_content(data)

            notif = Notification(
                recipient_type=data.recipient_type,
                recipient_id=data.recipient_id,
                template_id=template_id,
                title=title,
                body=body,
                payload=data.payload,
                channel=data.channel,
                action=data.action,
                status=NotificationStatus.UNREAD,
                expires_at=data.expires_at,
            )
            await self._repo.add(notif)
            await self._commit()

            if data.channel == NotificationChannel.EMAIL:
                await self._enqueue_email(notif)

            return NotificationResponse.model_validate(notif)
        except Exception:
            logger.exception("notify() failed (best-effort)")
            try:
                await self._rollback()
            except Exception:
                pass
            return None

    async def notify_bulk(
        self, data: NotifyBulkRequest
    ) -> list[NotificationResponse]:
        """Notify a list of employment IDs, applying preferences per recipient."""
        results: list[NotificationResponse] = []
        for emp_id in data.employment_ids:
            single = NotifyRequest(
                recipient_type=NotificationRecipientType.EMPLOYMENT,
                recipient_id=emp_id,
                template_code=data.template_code,
                title=data.title,
                body=data.body,
                payload=data.payload,
                channel=data.channel,
                action=data.action,
                expires_at=data.expires_at,
            )
            result = await self.notify(single)
            if result:
                results.append(result)
        return results

    async def _resolve_content(
        self, data: NotifyRequest
    ) -> tuple[str, str, Optional[int]]:
        if data.template_code:
            tpl = await self._repo.get_template_by_code(data.template_code)
            if tpl is None:
                raise NotFoundError(f"Template '{data.template_code}' not found")
            title = _render(tpl.title_template, data.payload)
            body = _render(tpl.body_template, data.payload)
            return title, body, tpl.id

        if not data.title or not data.body:
            raise DomainError(
                "title and body are required when template_code is not provided"
            )
        return data.title, data.body, None

    async def _enqueue_email(self, notif: Notification) -> None:
        # V1 stub — real email provider integration later
        logger.info(
            "EMAIL enqueue notification_id=%s recipient=%s/%s",
            notif.id,
            notif.recipient_type.value,
            notif.recipient_id,
        )

    # ==================================================================
    # Inbox (for authenticated user)
    # ==================================================================

    async def list_inbox(
        self,
        employment_id: int,
        *,
        status: Optional[NotificationStatus] = None,
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

    async def mark_read(
        self, notification_id: int, *, employment_id: int
    ) -> NotificationResponse:
        notif = await self._repo.get_notification_by_id(notification_id)
        if notif is None:
            raise NotFoundError("Notification not found")
        if (
            notif.recipient_type != NotificationRecipientType.EMPLOYMENT
            or notif.recipient_id != employment_id
        ):
            raise NotFoundError("Notification not found")

        if notif.status == NotificationStatus.UNREAD:
            notif.status = NotificationStatus.READ
            notif.read_at = datetime.now(timezone.utc)
            await self._commit()
        return NotificationResponse.model_validate(notif)

    async def archive(
        self, notification_id: int, *, employment_id: int
    ) -> NotificationResponse:
        notif = await self._repo.get_notification_by_id(notification_id)
        if notif is None:
            raise NotFoundError("Notification not found")
        if (
            notif.recipient_type != NotificationRecipientType.EMPLOYMENT
            or notif.recipient_id != employment_id
        ):
            raise NotFoundError("Notification not found")

        notif.status = NotificationStatus.ARCHIVED
        notif.archived_at = datetime.now(timezone.utc)
        if notif.read_at is None:
            notif.read_at = notif.archived_at
        await self._commit()
        return NotificationResponse.model_validate(notif)

    # ==================================================================
    # Preferences
    # ==================================================================

    async def list_preferences(
        self, employment_id: int
    ) -> list[PreferenceResponse]:
        rows = await self._repo.list_preferences(employment_id)
        return [PreferenceResponse.model_validate(r) for r in rows]

    async def set_preference(
        self,
        employment_id: int,
        data: PreferenceUpdate,
    ) -> PreferenceResponse:
        # V1 only allows IN_APP and EMAIL
        if data.channel not in (NotificationChannel.IN_APP, NotificationChannel.EMAIL):
            raise DomainError(f"Channel {data.channel.value} not supported in V1")

        pref = await self._repo.get_preference(employment_id, data.channel)
        if pref is None:
            pref = NotificationPreference(
                employment_id=employment_id,
                channel=data.channel,
                is_enabled=data.is_enabled,
            )
            await self._repo.add(pref)
        else:
            pref.is_enabled = data.is_enabled

        await self._commit()
        return PreferenceResponse.model_validate(pref)
