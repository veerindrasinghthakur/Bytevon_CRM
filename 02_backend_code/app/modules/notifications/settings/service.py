"""SettingsService — channel catalog (V1 static)."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.settings.schemas import ChannelInfo


class SettingsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_channels(self) -> list[ChannelInfo]:
        return [
            ChannelInfo(
                id="in_app",
                name="In-App",
                enabled=True,
                description="Bell / inbox notifications",
            ),
            ChannelInfo(
                id="email",
                name="Email",
                enabled=True,
                description="Email channel (stub delivery in V1)",
            ),
        ]
