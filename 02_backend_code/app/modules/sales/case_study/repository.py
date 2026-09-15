"""Case study repository — in-memory V1 (no table)."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession


class CaseStudyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[dict]:
        return []
