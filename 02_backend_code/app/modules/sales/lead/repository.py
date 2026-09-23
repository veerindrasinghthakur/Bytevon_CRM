"""Lead repository."""
from __future__ import annotations

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

    async def get(self, lead_id: int) -> Lead | None:
        lead = await self._session.get(Lead, lead_id)
        if lead is not None and bool(getattr(lead, "is_archived", False)):
            return None
        return lead

    async def list(
        self,
        *,
        status: LeadStatus | None = None,
        assigned_employment_id: int | None = None,
        limit: int = 500,
        offset: int = 0,
    ) -> list[Lead]:
        stmt = select(Lead).where(Lead.is_archived.is_(False))
        if status is not None:
            stmt = stmt.where(Lead.status == status)
        if assigned_employment_id is not None:
            stmt = stmt.where(Lead.assigned_employment_id == assigned_employment_id)
        stmt = stmt.order_by(Lead.id.desc()).limit(limit).offset(offset)
        return list((await self._session.execute(stmt)).scalars().all())
