"""Client repository."""
from __future__ import annotations
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repositories.base_repository import BaseRepository
from app.modules.sales.models import Client, ClientContact

class ClientRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_client(self, client_id: int, *, include_archived: bool = False) -> Optional[Client]:
        stmt = select(Client).where(Client.id == client_id)
        if not include_archived:
            stmt = stmt.where(Client.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_clients(self, *, include_archived: bool = False, limit: int = 500, offset: int = 0) -> Sequence[Client]:
        stmt = select(Client).order_by(Client.client_name)
        if not include_archived:
            stmt = stmt.where(Client.is_archived.is_(False))
        return await self.scalars(stmt.limit(limit).offset(offset))

    async def list_contacts(self, client_id: int) -> Sequence[ClientContact]:
        stmt = select(ClientContact).where(ClientContact.client_id == client_id).order_by(ClientContact.name)
        return await self.scalars(stmt)
