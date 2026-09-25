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
        # DEPARTMENT/TEAM fan-out: snapshot membership now and persist one
        # EMPLOYMENT row per member (no retroactive updates on later changes).
        if data.recipient_type != NotificationRecipientType.EMPLOYMENT:
            from app.modules.notifications.recipients import resolve_employment_ids

            try:
                member_ids = await resolve_employment_ids(
                    self._session, data.recipient_type, data.recipient_id
                )
            except Exception:
                logger.exception("recipient fan-out failed")
                return None
            first: NotificationResponse | None = None
            for emp_id in member_ids:
                result = await self.notify(
                    NotifyRequest(
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
                )
                if result is not None and first is None:
                    first = result
            return first
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

    #: frontend compose channel keys -> backend channels (SMS/PUSH deferred).
    COMPOSE_CHANNEL_MAP = {
        "inapp": NotificationChannel.IN_APP,
        "in_app": NotificationChannel.IN_APP,
        "email": NotificationChannel.EMAIL,
    }

    async def compose_broadcast(self, body) -> int:
        """Compose form send: broadcastAll -> all active employments, fan out
        per selected channel (IN_APP + EMAIL only). Returns queued count."""
        from app.modules.notifications.compose.schemas import ComposeBody
        from app.modules.notifications.recipients import all_active_employment_ids

        assert isinstance(body, ComposeBody)
        employment_ids = list(body.employment_ids)
        if body.broadcastAll:
            employment_ids = await all_active_employment_ids(self._session)
        if not employment_ids:
            return 0
        wanted: list[NotificationChannel] = []
        for key, on in (body.channels or {}).items():
            mapped = self.COMPOSE_CHANNEL_MAP.get(str(key).lower()) if on else None
            if mapped is not None and mapped not in wanted:
                wanted.append(mapped)
        if not wanted:
            wanted = [NotificationChannel.IN_APP]
        queued = 0
        sent_ids: list[int] = []
        for channel in wanted:
            rows = await self.notify_bulk(
                NotifyBulkRequest(
                    employment_ids=employment_ids,
                    template_code=body.template_code,
                    title=body.title or None,
                    body=body.body or None,
                    channel=channel,
                )
            )
            queued += len(rows)
            sent_ids.extend(r.id for r in rows)
        if body.attachment_ids and sent_ids:
            from app.modules.notifications.attachments.service import (
                AttachmentService,
            )

            await AttachmentService(self._session).link_to_notifications(
                list(body.attachment_ids), sent_ids
            )
        return queued

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
        """Deliver an EMAIL-channel notification via SMTP (fail-soft).

        Only EMPLOYMENT recipients are email-addressable in V1; DEPARTMENT/TEAM
        recipients keep their persisted in-app notification and are skipped here.
        Never raises — failures are logged so business work is unaffected.
        """
        from sqlalchemy import select

        from app.core.email import EmailClient
        from app.modules.auth.models import Login
        from app.modules.workforce.models import Employment

        try:
            if notif.recipient_type != NotificationRecipientType.EMPLOYMENT:
                logger.info(
                    "EMAIL skipped (recipient type %s has no direct address): "
                    "notification_id=%s",
                    notif.recipient_type.value,
                    notif.id,
                )
                return

            employment = (
                await self._session.execute(
                    select(Employment).where(Employment.id == notif.recipient_id)
                )
            ).scalar_one_or_none()
            if employment is None:
                logger.warning(
                    "EMAIL skipped (employment not found): notification_id=%s recipient_id=%s",
                    notif.id,
                    notif.recipient_id,
                )
                return

            login = (
                await self._session.execute(
                    select(Login).where(
                        Login.person_id == employment.person_id,
                        Login.is_active.is_(True),
                    )
                )
            ).scalar_one_or_none()
            if login is None or not login.email:
                logger.warning(
                    "EMAIL skipped (no active login email): notification_id=%s employment_id=%s",
                    notif.id,
                    notif.recipient_id,
                )
                return

            result = await EmailClient().send_email(
                to=login.email,
                subject=notif.title,
                text_body=notif.body,
            )
            logger.info(
                "EMAIL notification_id=%s to employment=%s status=%s",
                notif.id,
                notif.recipient_id,
                result.status,
            )
        except Exception:
            logger.exception(
                "EMAIL delivery failed (fail-soft): notification_id=%s",
                notif.id,
            )
