"""SentService — outbound history (V1 empty)."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.sent.schemas import SentListResponse


class SentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_sent(self, *, page: int = 1, page_size: int = 20) -> SentListResponse:
        return SentListResponse(page=page, pageSize=page_size)
