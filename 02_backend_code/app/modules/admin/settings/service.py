"""SettingsService — organization settings singleton."""
from __future__ import annotations
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions.exception import NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.settings.models import OrganizationSettings
from app.modules.admin.settings.repository import SettingsRepository
from app.modules.admin.settings.schemas import OrganizationSettingsResponse, OrganizationSettingsUpdate

class SettingsService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = SettingsRepository(session)

    async def get(self) -> OrganizationSettingsResponse:
        row = await self._repo.get()
        if row is None:
            raise NotFoundError("Organization settings not configured")
        return OrganizationSettingsResponse.model_validate(row)

    async def upsert(self, data: OrganizationSettingsUpdate, *, actor_employment_id: Optional[int] = None) -> OrganizationSettingsResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        row = await self._repo.get()
        payload = data.model_dump(exclude_unset=True)
        if row is None:
            row = OrganizationSettings(
                company_name=payload.get("company_name") or "Organization",
                head_office_location_id=payload.get("head_office_location_id"),
                default_timezone=payload.get("default_timezone") or "UTC",
                default_currency=payload.get("default_currency") or "USD",
                logo_reference=payload.get("logo_reference"),
                changed_by=actor,
            )
            await self._repo.add(row)
        else:
            for field, value in payload.items():
                if hasattr(row, field):
                    setattr(row, field, value)
            row.changed_by = actor
        await self._commit()
        await self._audit("organization_settings.upserted", row.id, actor_employment_id)
        await self._session.refresh(row)
        return OrganizationSettingsResponse.model_validate(row)

SettingsPublicService = SettingsService
