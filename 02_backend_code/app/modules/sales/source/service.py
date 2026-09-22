"""SourceService — lead sources (platforms table). Soft-delete via is_archived."""
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
    SourceListResponse,
    SourceMetrics,
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

    async def get(self, source_id: int, *, include_archived: bool = False) -> SourceResponse:
        """Q15: archived hidden by default; history views opt in."""
        row = await self._repo.get(source_id, include_archived=True)
        if row is None:
            raise NotFoundError("Source not found")
        if bool(getattr(row, "is_archived", False)) and not include_archived:
            raise NotFoundError("Source not found")
        return SourceResponse.model_validate(row)

    async def list(
        self, *, include_archived: bool = False, include_deleted: bool = False
    ) -> SourceListResponse:
        # include_deleted kept as compat alias
        show = bool(include_archived or include_deleted)
        rows = await self._repo.list_all(include_archived=show)
        items = [SourceResponse.model_validate(r) for r in rows]
        active = sum(1 for i in items if not i.is_archived)
        archived = sum(1 for i in items if i.is_archived)
        metrics = SourceMetrics(total=len(items), active=active, archived=archived)
        return SourceListResponse(items=items, total=len(items), metrics=metrics)

    # Back-compat: old callers expect list[...]
    async def list_items(self, *, include_archived: bool = False) -> list[SourceResponse]:
        res = await self.list(include_archived=include_archived)
        return res.items

    async def update(
        self, source_id: int, data: SourceUpdate, *, actor_employment_id: int | None = None
    ) -> SourceResponse:
        row = await self._repo.get(source_id, include_archived=True)
        if row is None or bool(getattr(row, "is_archived", False)):
            raise NotFoundError("Source not found")
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

    async def delete(self, source_id: int, *, actor_employment_id: int | None = None) -> MessageResponse:
        row = await self._repo.get(source_id, include_archived=True)
        if row is None or bool(getattr(row, "is_archived", False)):
            raise NotFoundError("Source not found")
        row.is_archived = True
        if hasattr(row, "archived_at"):
            row.archived_at = datetime.now(UTC)
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("platform.deleted", source_id, actor_employment_id)
        return MessageResponse(message="Source deleted")

    # Deprecated alias
    async def archive(self, source_id: int, *, actor_employment_id: int | None = None) -> MessageResponse:
        return await self.delete(source_id, actor_employment_id=actor_employment_id)

    async def restore(self, source_id: int, *, actor_employment_id: int | None = None) -> SourceResponse:
        """Q16: restore an archived source (409 on active name clash)."""
        row = await self._repo.get(source_id, include_archived=True)
        if row is None:
            raise NotFoundError("Source not found")
        if not bool(getattr(row, "is_archived", False)):
            raise DomainError("Source is not archived")
        clash = await self._repo.get_by_name(row.name)
        if clash is not None and clash.id != source_id:
            raise ConflictError(f"Cannot restore: source '{row.name}' already exists")
        row.is_archived = False
        if hasattr(row, "archived_at"):
            row.archived_at = None
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("platform.restored", source_id, actor_employment_id)
        await self._session.refresh(row)
        return SourceResponse.model_validate(row)


# Back-compat
PlatformService = SourceService
