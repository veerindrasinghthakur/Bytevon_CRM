"""Settings repository — no DB reads in V1 (static channels)."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession


class SettingsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
