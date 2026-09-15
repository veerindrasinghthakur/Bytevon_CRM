"""Sent repository — V1 stub (no outbound log table yet)."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession


class SentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
