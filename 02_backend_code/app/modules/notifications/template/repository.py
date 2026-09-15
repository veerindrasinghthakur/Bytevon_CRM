"""Template repository."""
from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.notifications.models import NotificationTemplate


class TemplateRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_template_by_id(
        self, template_id: int
    ) -> Optional[NotificationTemplate]:
        stmt = select(NotificationTemplate).where(
            NotificationTemplate.id == template_id
        )
        return await self.scalar_one_or_none(stmt)

    async def get_template_by_code(
        self, code: str
    ) -> Optional[NotificationTemplate]:
        stmt = select(NotificationTemplate).where(
            NotificationTemplate.code == code
        )
        return await self.scalar_one_or_none(stmt)

    async def list_templates(
        self, *, active_only: bool = False
    ) -> Sequence[NotificationTemplate]:
        stmt = select(NotificationTemplate).order_by(NotificationTemplate.code)
        if active_only:
            stmt = stmt.where(NotificationTemplate.is_active.is_(True))
        return await self.scalars(stmt)
