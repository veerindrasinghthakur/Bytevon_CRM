"""Transactional email client (SMTP, Gmail defaults).

Fail-soft by design: send failures are logged and returned, never raised,
so email problems can never roll back business transactions.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EmailResult:
    """Outcome of a send attempt."""

    status: str  # "sent" | "skipped" | "failed"
    message_id: str | None = None
    error: str | None = None


class EmailClient:
    """Thin async wrapper around aiosmtplib with a kill-switch."""

    def __init__(
        self,
        *,
        enabled: bool | None = None,
        host: str | None = None,
        port: int | None = None,
        use_tls: bool | None = None,
        username: str | None = None,
        password: str | None = None,
        from_email: str | None = None,
        from_name: str | None = None,
        timeout: int | None = None,
    ) -> None:
        self._enabled = settings.EMAIL_ENABLED if enabled is None else enabled
        self._host = settings.SMTP_HOST if host is None else host
        self._port = settings.SMTP_PORT if port is None else port
        self._use_tls = settings.SMTP_USE_TLS if use_tls is None else use_tls
        self._username = settings.SMTP_USERNAME if username is None else username
        self._password = settings.SMTP_PASSWORD if password is None else password
        self._from_email = settings.SMTP_FROM_EMAIL if from_email is None else from_email
        self._from_name = settings.SMTP_FROM_NAME if from_name is None else from_name
        self._timeout = settings.SMTP_TIMEOUT_SECONDS if timeout is None else timeout

    @property
    def is_configured(self) -> bool:
        return bool(
            self._enabled and self._host and self._username and self._password and self._from_email
        )

    async def send_email(
        self,
        *,
        to: str,
        subject: str,
        text_body: str,
        html_body: str | None = None,
        from_email: str | None = None,
        from_name: str | None = None,
    ) -> EmailResult:
        if not self.is_configured:
            logger.info(
                "Email skipped (disabled or unconfigured): to=%s subject=%s",
                to,
                subject,
            )
            return EmailResult(status="skipped")

        sender = f"{from_name or self._from_name} <{from_email or self._from_email}>"
        message = EmailMessage()
        message["From"] = sender
        message["To"] = to
        message["Subject"] = subject
        message.set_content(text_body)
        if html_body:
            message.add_alternative(html_body, subtype="html")

        try:
            from aiosmtplib import send as aiosmtplib_send

            # Gmail App Passwords are shown grouped with spaces; strip them.
            password = (self._password or "").replace(" ", "")
            result = await aiosmtplib_send(
                message,
                hostname=self._host,
                port=self._port,
                username=self._username,
                password=password,
                start_tls=self._use_tls,
                timeout=self._timeout,
            )
            logger.info("Email sent: to=%s subject=%s", to, subject)
            message_id = None
            try:
                message_id = str(result[1]) if result else None
            except Exception:  # noqa: BLE001 - best-effort extraction only
                message_id = None
            return EmailResult(status="sent", message_id=message_id)
        except Exception as exc:  # noqa: BLE001 - fail-soft by design
            logger.exception("Email send failed: to=%s subject=%s", to, subject)
            return EmailResult(status="failed", error=str(exc))
