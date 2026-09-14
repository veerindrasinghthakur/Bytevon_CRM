"""PositionService — admin CRUD for job positions."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.workforce.models import Position
from app.modules.admin.position.repository import PositionRepository
from app.modules.admin.position.schemas import (
    MessageResponse, PositionCreate, PositionResponse, PositionUpdate,
)

class PositionService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = PositionRepository(session)

    async def create(self, data: PositionCreate, *, actor_employment_id: Optional[int] = None) -> PositionResponse:
        existing = await self._repo.get_by_name(data.name.strip())
        if existing:
            raise ConflictError(f"Position '{data.name}' already exists")
        pos = Position(name=data.name.strip())
        await self._repo.add(pos)
        await self._commit()
        await self._audit("position.created", pos.id, actor_employment_id)
        await self._session.refresh(pos)
        return PositionResponse.model_validate(pos)

    async def get(self, position_id: int) -> PositionResponse:
        pos = await self._repo.get_by_id(position_id, include_archived=True)
        if pos is None:
            raise NotFoundError("Position not found")
        return PositionResponse.model_validate(pos)

    async def list(self, *, include_archived: bool = False) -> list[PositionResponse]:
        rows = await self._repo.list_all(include_archived=include_archived)
        return [PositionResponse.model_validate(r) for r in rows]

    async def update(
        self, position_id: int, data: PositionUpdate, *, actor_employment_id: Optional[int] = None
    ) -> PositionResponse:
        pos = await self._repo.get_by_id(position_id, include_archived=True)
        if pos is None:
            raise NotFoundError("Position not found")
        if pos.is_archived:
            raise DomainError("Cannot update archived position")
        if data.name is not None:
            name = data.name.strip()
            clash = await self._repo.get_by_name(name)
            if clash and clash.id != position_id:
                raise ConflictError(f"Position '{name}' already exists")
            pos.name = name
        await self._commit()
        await self._audit("position.updated", position_id, actor_employment_id)
        await self._session.refresh(pos)
        return PositionResponse.model_validate(pos)

    async def archive(self, position_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        pos = await self._repo.get_by_id(position_id, include_archived=True)
        if pos is None:
            raise NotFoundError("Position not found")
        if pos.is_archived:
            raise DomainError("Position is already archived")
        pos.is_archived = True
        pos.archived_at = datetime.now(timezone.utc)
        await self._commit()
        await self._audit("position.archived", position_id, actor_employment_id)
        return MessageResponse(message="Position archived")

PositionPublicService = PositionService
