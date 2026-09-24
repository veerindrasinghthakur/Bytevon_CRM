"""Dashboard repository — aggregate counts from leads/clients."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import LeadStatus
from app.modules.sales.models import Client, Lead


class DashboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def lead_count(self) -> int:
        return int(await self._session.scalar(select(func.count()).select_from(Lead)) or 0)

    async def won_count(self) -> int:
        return int(
            await self._session.scalar(
                select(func.count()).select_from(Lead).where(Lead.status == LeadStatus.WON)
            )
            or 0
        )

    async def client_count(self) -> int:
        return int(
            await self._session.scalar(
                select(func.count()).select_from(Client).where(Client.is_archived.is_(False))
            )
            or 0
        )

    async def source_count(self) -> dict[str, int]:
        from app.modules.sales.models import Platform

        total = int(await self._session.scalar(select(func.count()).select_from(Platform)) or 0)
        active = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Platform)
                .where(Platform.is_archived.is_(False))
            )
            or 0
        )
        return {"total": total, "active": active}
