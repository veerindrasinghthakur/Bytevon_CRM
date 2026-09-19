"""SourceService — lead sources (platforms table)."""
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.sales.models import Platform
from app.modules.sales.source.repository import SourceRepository
from app.modules.sales.source.schemas import (
    MessageResponse,
    SourceCreate,
    SourceResponse,
    SourceUpdate,
)


class SourceService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = SourceRepository(session)

    async def create(self, data: SourceCreate, *, actor_employment_id: int | None = None) -> SourceResponse:
        existing = await self._repo.get_by_name(data.name.strip())
        if existing:
            raise ConflictError(f"Source '{data.name}' already exists")
        row = Platform(
            name=data.name.strip(),
            description=data.description,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(row)
        await self._commit()
        await self._audit("platform.created", row.id, actor_employment_id)
        await self._session.refresh(row)
        return SourceResponse.model_validate(row)

    async def get(self, source_id: int) -> SourceResponse:
        row = await self._repo.get(source_id, include_archived=True)
        if row is None:
            raise NotFoundError("Source not found")
        return SourceResponse.model_validate(row)

    async def list(self, *, include_archived: bool = False) -> list[SourceResponse]:
        rows = await self._repo.list_all(include_archived=include_archived)
        return [SourceResponse.model_validate(r) for r in rows]

    async def update(
        self, source_id: int, data: SourceUpdate, *, actor_employment_id: int | None = None
    ) -> SourceResponse:
        row = await self._repo.get(source_id, include_archived=True)
        if row is None:
            raise NotFoundError("Source not found")
        if row.is_archived:
            raise DomainError("Cannot update archived source")
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload and payload["name"] is not None:
            name = payload["name"].strip()
            clash = await self._repo.get_by_name(name)
            if clash and clash.id != source_id:
                raise ConflictError(f"Source '{name}' already exists")
            row.name = name
        if "description" in payload:
            row.description = payload["description"]
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("platform.updated", source_id, actor_employment_id)
        await self._session.refresh(row)
        return SourceResponse.model_validate(row)

    async def archive(self, source_id: int, *, actor_employment_id: int | None = None) -> MessageResponse:
        row = await self._repo.get(source_id, include_archived=True)
        if row is None:
            raise NotFoundError("Source not found")
        if row.is_archived:
            return MessageResponse(message="Source already archived")
        row.is_archived = True
        row.archived_at = datetime.now(UTC)
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("platform.archived", source_id, actor_employment_id)
        return MessageResponse(message="Source archived")


# Back-compat
PlatformService = SourceService
