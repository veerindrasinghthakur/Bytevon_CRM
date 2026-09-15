"""ActivityService — recent sales activity feed."""
from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.services.base_public_service import BasePublicService
from app.modules.sales.activity.repository import ActivityRepository


class ActivityService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ActivityRepository(session)

    async def list_recent(self, *, limit: int = 10) -> list[dict[str, Any]]:
        leads = await self._repo.recent_leads(limit=max(limit, 20))
        out: list[dict[str, Any]] = []
        for r in leads[:limit]:
            st = r.status.value if hasattr(r.status, "value") else str(r.status)
            out.append(
                {
                    "id": f"lead-{r.id}",
                    "text": f"Lead '{r.lead_title}' — {st}",
                    "time": r.updated_at.isoformat() if r.updated_at else "",
                    "type": "lead",
                }
            )
        return out
