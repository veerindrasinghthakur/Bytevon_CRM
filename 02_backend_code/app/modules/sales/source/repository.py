"""Source repository (platforms table). Soft-delete via is_archived."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sales.models import Platform


class SourceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, row: Platform) -> Platform:
        self._session.add(row)
        await self._session.flush()
        return row

    async def get(self, platform_id: int, *, include_archived: bool = False) -> Platform | None:
        row = await self._session.get(Platform, platform_id)
        if row is None:
            return None
        if not include_archived and bool(getattr(row, "is_archived", False)):
            return None
        return row

    async def get_by_name(self, name: str) -> Platform | None:
        stmt = select(Platform).where(
            Platform.name == name, Platform.is_archived.is_(False)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def list_all(self, *, include_archived: bool = False) -> list[Platform]:
        stmt = select(Platform)
        if not include_archived:
            stmt = stmt.where(Platform.is_archived.is_(False))
        stmt = stmt.order_by(Platform.name)
        return list((await self._session.execute(stmt)).scalars().all())

    async def counts(self) -> tuple[int, int]:
        total = int((await self._session.execute(select(func.count(Platform.id)))).scalar() or 0)
        archived = int(
            (await self._session.execute(select(func.count(Platform.id)).where(Platform.is_archived.is_(True)))).scalar() or 0
        )
        return total, archived
