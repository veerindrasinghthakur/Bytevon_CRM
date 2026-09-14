"""PlatformService — lead sources."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.sales.models import Platform
from app.modules.sales.domains.platform.repository import PlatformRepository
from app.modules.sales.domains.platform.schemas import (
    MessageResponse, PlatformCreate, PlatformResponse, PlatformUpdate,
)

class PlatformService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = PlatformRepository(session)

    async def create(self, data: PlatformCreate, *, actor_employment_id: Optional[int] = None) -> PlatformResponse:
        existing = await self._repo.get_by_name(data.name.strip())
        if existing:
            raise ConflictError(f"Platform '{data.name}' already exists")
        row = Platform(
            name=data.name.strip(),
            description=data.description,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(row)
        await self._commit()
        await self._audit("platform.created", row.id, actor_employment_id)
        await self._session.refresh(row)
        return PlatformResponse.model_validate(row)

    async def get(self, platform_id: int) -> PlatformResponse:
        row = await self._repo.get(platform_id, include_archived=True)
        if row is None:
            raise NotFoundError("Platform not found")
        return PlatformResponse.model_validate(row)

    async def list(self, *, include_archived: bool = False) -> list[PlatformResponse]:
        rows = await self._repo.list_all(include_archived=include_archived)
        return [PlatformResponse.model_validate(r) for r in rows]

    async def update(self, platform_id: int, data: PlatformUpdate, *, actor_employment_id: Optional[int] = None) -> PlatformResponse:
        row = await self._repo.get(platform_id, include_archived=True)
        if row is None:
            raise NotFoundError("Platform not found")
        if row.is_archived:
            raise DomainError("Cannot update archived platform")
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload and payload["name"] is not None:
            name = payload["name"].strip()
            clash = await self._repo.get_by_name(name)
            if clash and clash.id != platform_id:
                raise ConflictError(f"Platform '{name}' already exists")
            row.name = name
        if "description" in payload:
            row.description = payload["description"]
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("platform.updated", platform_id, actor_employment_id)
        await self._session.refresh(row)
        return PlatformResponse.model_validate(row)

    async def archive(self, platform_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        row = await self._repo.get(platform_id, include_archived=True)
        if row is None:
            raise NotFoundError("Platform not found")
        if row.is_archived:
            return MessageResponse(message="Platform already archived")
        row.is_archived = True
        row.archived_at = datetime.now(timezone.utc)
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("platform.archived", platform_id, actor_employment_id)
        return MessageResponse(message="Platform archived")

PlatformPublicService = PlatformService
