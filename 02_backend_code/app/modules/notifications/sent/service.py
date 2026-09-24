"""SentService — outbound history sourced from EMAIL-channel notifications."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.center.schemas import NotificationResponse
from app.modules.notifications.sent.repository import SentRepository
from app.modules.notifications.sent.schemas import SentListResponse


class SentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = SentRepository(session)

    async def list_sent(self, *, page: int = 1, page_size: int = 20) -> SentListResponse:
        page = max(1, page)
        page_size = max(1, min(page_size, 200))
        total = await self._repo.count_email_notifications()
        rows = await self._repo.list_email_notifications(
            skip=(page - 1) * page_size, limit=page_size
        )
        return SentListResponse(
            items=[NotificationResponse.model_validate(r) for r in rows],
            total=total,
            page=page,
            pageSize=page_size,
        )
