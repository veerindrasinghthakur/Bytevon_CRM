"""Source repository (platforms table)."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sales.models import Platform


class SourceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, row: Platform) -> Platform:
        self._session.add(row)
        await self._session.flush()
        return row

    async def get(self, platform_id: int, *, include_archived: bool = False) -> Optional[Platform]:
        row = await self._session.get(Platform, platform_id)
        if row is None:
            return None
        if not include_archived and row.is_archived:
            return None
        return row

    async def get_by_name(self, name: str) -> Optional[Platform]:
        stmt = select(Platform).where(Platform.name == name)
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def list_all(self, *, include_archived: bool = False) -> list[Platform]:
        stmt = select(Platform)
        if not include_archived:
            stmt = stmt.where(Platform.is_archived.is_(False))
        stmt = stmt.order_by(Platform.name)
        return list((await self._session.execute(stmt)).scalars().all())
