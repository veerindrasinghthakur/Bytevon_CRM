"""DashboardService — KPIs + analytics."""
from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.services.base_public_service import BasePublicService
from app.modules.sales.dashboard.repository import DashboardRepository


class DashboardService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = DashboardRepository(session)

    async def metrics(self) -> list[dict[str, Any]]:
        leads = await self._repo.lead_count()
        won = await self._repo.won_count()
        clients = await self._repo.client_count()
        sources = await self._repo.source_count()
        return [
            {"id": "leads", "icon": "group", "label": "Total leads", "value": str(leads)},
            {"id": "won", "icon": "emoji_events", "label": "Won", "value": str(won)},
            {"id": "clients", "icon": "business", "label": "Clients", "value": str(clients)},
            {
                "id": "sources",
                "icon": "source",
                "label": "Total sources",
                "value": str(sources["total"]),
                "subtitle": f"{sources['active']} active",
            },
        ]

    async def analytics(self) -> list[dict[str, Any]]:
        return await self.metrics()
