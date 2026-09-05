"""
SalesRepository — domain-specific queries only.
"""

from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import select
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
    # Platforms
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
