"""
SalesRepository — domain-specific queries only.
"""

from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import LeadStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.sales.models import Client, ClientContact, Lead, Platform


class SalesRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Clients
    # ------------------------------------------------------------------

    async def get_client_by_id(
        self, client_id: int, *, include_archived: bool = False
    ) -> Optional[Client]:
        stmt = select(Client).where(Client.id == client_id)
        if not include_archived:
            stmt = stmt.where(Client.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_clients(
        self, *, include_archived: bool = False, limit: int = 100, offset: int = 0
    ) -> Sequence[Client]:
        stmt = select(Client).order_by(Client.client_name).limit(limit).offset(offset)
        if not include_archived:
            stmt = stmt.where(Client.is_archived.is_(False))
        return await self.scalars(stmt)

    async def find_client_by_name(self, name: str) -> Optional[Client]:
        stmt = select(Client).where(
            Client.client_name == name, Client.is_archived.is_(False)
        )
        return await self.scalar_one_or_none(stmt)

    # ------------------------------------------------------------------
    # Contacts
    # ------------------------------------------------------------------

    async def list_contacts_for_client(
        self, client_id: int
    ) -> Sequence[ClientContact]:
        stmt = (
            select(ClientContact)
            .where(ClientContact.client_id == client_id)
            .order_by(ClientContact.name)
        )
        return await self.scalars(stmt)

    # ------------------------------------------------------------------
    # Platforms (lead sources)
    # ------------------------------------------------------------------

    async def get_platform_by_id(
        self, platform_id: int, *, include_archived: bool = False
    ) -> Optional[Platform]:
        stmt = select(Platform).where(Platform.id == platform_id)
        if not include_archived:
            stmt = stmt.where(Platform.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_platforms(
        self, *, include_archived: bool = False
    ) -> Sequence[Platform]:
        stmt = select(Platform).order_by(Platform.name)
        if not include_archived:
            stmt = stmt.where(Platform.is_archived.is_(False))
        return await self.scalars(stmt)

    async def count_leads_by_platform(self) -> dict[int, int]:
        """platform_id → lead count (null platform_id excluded)."""
        stmt = (
            select(Lead.platform_id, func.count(Lead.id))
            .where(Lead.platform_id.is_not(None))
            .group_by(Lead.platform_id)
        )
        result = await self._session.execute(stmt)
        return {int(pid): int(cnt) for pid, cnt in result.all() if pid is not None}

    async def find_platform_by_name(
        self, name: str, *, exclude_id: Optional[int] = None
    ) -> Optional[Platform]:
        stmt = select(Platform).where(
            func.lower(Platform.name) == name.strip().lower(),
            Platform.is_archived.is_(False),
        )
        if exclude_id is not None:
            stmt = stmt.where(Platform.id != exclude_id)
        return await self.scalar_one_or_none(stmt)

    # ------------------------------------------------------------------
    # Leads
    # ------------------------------------------------------------------

    async def get_lead_by_id(self, lead_id: int) -> Optional[Lead]:
        stmt = select(Lead).where(Lead.id == lead_id)
        return await self.scalar_one_or_none(stmt)

    async def list_leads(
        self,
        *,
        status: Optional[LeadStatus] = None,
        assigned_employment_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Lead]:
        stmt = select(Lead).order_by(Lead.created_at.desc())
        if status is not None:
            stmt = stmt.where(Lead.status == status)
        if assigned_employment_id is not None:
            stmt = stmt.where(Lead.assigned_employment_id == assigned_employment_id)
        stmt = stmt.limit(limit).offset(offset)
        return await self.scalars(stmt)
