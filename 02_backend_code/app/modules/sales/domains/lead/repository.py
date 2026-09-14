"""Lead repository."""
from __future__ import annotations
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db.enums import LeadStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.sales.models import Lead

class LeadRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get(self, lead_id: int) -> Optional[Lead]:
        return await self.scalar_one_or_none(select(Lead).where(Lead.id == lead_id))

    async def list(
        self,
        *,
        status: Optional[LeadStatus] = None,
        assigned_employment_id: Optional[int] = None,
        limit: int = 500,
        offset: int = 0,
    ) -> Sequence[Lead]:
        stmt = select(Lead).order_by(Lead.updated_at.desc())
        if status is not None:
            stmt = stmt.where(Lead.status == status)
        if assigned_employment_id is not None:
            stmt = stmt.where(Lead.assigned_employment_id == assigned_employment_id)
        return await self.scalars(stmt.limit(limit).offset(offset))
