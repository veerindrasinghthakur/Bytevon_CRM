"""My Work Requests repository — stub."""
from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository


class MyWorkRequestsRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_my_requests(
        self,
        employment_id: int | None,
        *,
        status: str | None = None,
        search: str | None = None,
        limit: int = 20,
    ) -> Sequence[dict]:
        return []

    async def count_my_requests(
        self,
        employment_id: int | None,
        *,
        status: str | None = None,
        search: str | None = None,
    ) -> int:
        return 0
