"""My Work Tasks repository — stub until project.task domain wired."""
from __future__ import annotations

from typing import List, Optional, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository


class MyWorkTasksRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_my_tasks(
        self,
        employment_id: Optional[int],
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Sequence[dict]:
        return []

    async def count_my_tasks(
        self,
        employment_id: Optional[int],
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> int:
        return 0
