"""Activity repository — derived from recent leads (V1)."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sales.models import Lead


class ActivityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def recent_leads(self, *, limit: int = 20) -> list[Lead]:
        stmt = select(Lead).order_by(Lead.updated_at.desc()).limit(limit)
        return list((await self._session.execute(stmt)).scalars().all())
