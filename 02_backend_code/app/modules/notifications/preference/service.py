"""PreferenceService."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationChannel
from app.core.exceptions.exception import DomainError
from app.core.services.base_public_service import BasePublicService
from app.modules.notifications.models import NotificationPreference
from app.modules.notifications.preference.repository import PreferenceRepository
from app.modules.notifications.preference.schemas import (
    PreferenceResponse,
    PreferenceUpdate,
)


class PreferenceService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = PreferenceRepository(session)

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
        if data.channel not in (
            NotificationChannel.IN_APP,
            NotificationChannel.EMAIL,
        ):
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
