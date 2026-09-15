"""Lead repository."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import LeadStatus
from app.modules.sales.models import Lead


class LeadRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, lead: Lead) -> Lead:
        self._session.add(lead)
        await self._session.flush()
        return lead

    async def get(self, lead_id: int) -> Optional[Lead]:
        return await self._session.get(Lead, lead_id)

    async def list(
        self,
        *,
        status: Optional[LeadStatus] = None,
        assigned_employment_id: Optional[int] = None,
        limit: int = 500,
        offset: int = 0,
    ) -> list[Lead]:
        stmt = select(Lead)
        if status is not None:
            stmt = stmt.where(Lead.status == status)
        if assigned_employment_id is not None:
            stmt = stmt.where(Lead.assigned_employment_id == assigned_employment_id)
        stmt = stmt.order_by(Lead.id.desc()).limit(limit).offset(offset)
        return list((await self._session.execute(stmt)).scalars().all())
