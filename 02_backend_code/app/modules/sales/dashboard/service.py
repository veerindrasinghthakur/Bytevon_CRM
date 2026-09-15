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
        return [
            {"id": "leads", "label": "Total leads", "value": str(leads)},
            {"id": "won", "label": "Won", "value": str(won)},
            {"id": "clients", "label": "Clients", "value": str(clients)},
            {"id": "pipeline", "label": "Open pipeline", "value": str(max(0, leads - won))},
        ]

    async def analytics(self) -> list[dict[str, Any]]:
        return await self.metrics()
