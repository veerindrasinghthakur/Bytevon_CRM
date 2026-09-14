"""Organization settings repository (singleton)."""
from __future__ import annotations
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repositories.base_repository import BaseRepository
from app.modules.admin.settings.models import OrganizationSettings

class SettingsRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get(self) -> Optional[OrganizationSettings]:
        return await self.scalar_one_or_none(select(OrganizationSettings).limit(1))
