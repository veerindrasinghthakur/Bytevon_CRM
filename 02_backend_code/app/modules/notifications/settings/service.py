"""SettingsService — channel catalog derived from NotificationChannel enum."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationChannel
from app.modules.notifications.settings.schemas import ChannelInfo

_CHANNEL_META = {
    NotificationChannel.IN_APP: ("In-App", "Bell / inbox notifications"),
    NotificationChannel.EMAIL: ("Email", "Transactional email via SMTP"),
}


class SettingsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_channels(self) -> list[ChannelInfo]:
        from app.core.email import EmailClient

        items: list[ChannelInfo] = []
        for channel in NotificationChannel:
            name, description = _CHANNEL_META.get(
                channel, (channel.value.replace("_", " ").title(), None)
            )
            if channel == NotificationChannel.EMAIL:
                configured = EmailClient().is_configured
                items.append(
                    ChannelInfo(
                        id="email",
                        name=name,
                        enabled=configured,
                        description=description
                        if configured
                        else "Email channel (SMTP not configured — set EMAIL_ENABLED and SMTP_* in .env)",
                    )
                )
            else:
                items.append(
                    ChannelInfo(
                        id=channel.value.lower(),
                        name=name,
                        enabled=True,
                        description=description,
                    )
                )
        return items
