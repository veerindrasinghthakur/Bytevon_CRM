"""Location repository."""
from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.admin.location.models import Location


class LocationRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_id(
        self, location_id: int, *, include_archived: bool = False
    ) -> Location | None:
        stmt = select(Location).where(Location.id == location_id)
        if not include_archived:
            stmt = stmt.where(Location.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_all(self, *, include_archived: bool = False) -> Sequence[Location]:
        stmt = select(Location).order_by(Location.name)
        if not include_archived:
            stmt = stmt.where(Location.is_archived.is_(False))
        return await self.scalars(stmt)

    async def list(self, *, include_archived: bool = False) -> Sequence[Location]:
        return await self.list_all(include_archived=include_archived)
