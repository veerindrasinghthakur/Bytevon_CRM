"""My Work Leave repository — stub until wired to leave.request domain."""
from __future__ import annotations

from typing import List, Optional, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository


class MyWorkLeaveRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_my_requests(
        self,
        employment_id: Optional[int],
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Sequence[dict]:
        return []

    async def count_my_requests(
        self,
        employment_id: Optional[int],
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> int:
        return 0

    async def get_balances(self, employment_id: Optional[int]) -> List[dict]:
        return []

    async def get_types(self) -> List[dict]:
        return [
            {"value": "ANNUAL", "label": "Annual Leave", "requires_approval": True},
            {"value": "SICK", "label": "Sick Leave", "requires_approval": False},
        ]
