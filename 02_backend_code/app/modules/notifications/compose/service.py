"""ComposeService — notify / notify_bulk / compose (post-commit entry)."""
from __future__ import annotations

import logging
import re
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import (
    NotificationChannel,
    NotificationRecipientType,
    NotificationStatus,
)
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.notifications.compose.repository import ComposeRepository
from app.modules.notifications.compose.schemas import (
    NotificationResponse,
    NotifyBulkRequest,
    NotifyRequest,
)
from app.modules.notifications.models import Notification

logger = logging.getLogger(__name__)
_TEMPLATE_VAR = re.compile(r"\{\{\s*(\w+)\s*\}\}")


def _render(template: str, payload: dict[str, Any]) -> str:
    def repl(match: re.Match) -> str:
        key = match.group(1)
        return str(payload.get(key, match.group(0)))

    return _TEMPLATE_VAR.sub(repl, template)


class ComposeService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ComposeRepository(session)

    async def notify(self, data: NotifyRequest) -> NotificationResponse | None:
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
    ) -> tuple[str, str, int | None]:
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
        logger.info(
            "EMAIL enqueue notification_id=%s recipient=%s/%s",
            notif.id,
            notif.recipient_type.value,
            notif.recipient_id,
        )
