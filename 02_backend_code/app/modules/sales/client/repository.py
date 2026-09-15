"""Client repository."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sales.models import Client, ClientContact


class ClientRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, obj) -> None:
        self._session.add(obj)
        await self._session.flush()

    async def get_client(self, client_id: int, *, include_archived: bool = False) -> Optional[Client]:
        client = await self._session.get(Client, client_id)
        if client is None:
            return None
        if not include_archived and client.is_archived:
            return None
        return client

    async def list_clients(
        self, *, include_archived: bool = False, limit: int = 100, offset: int = 0
    ) -> list[Client]:
        stmt = select(Client)
        if not include_archived:
            stmt = stmt.where(Client.is_archived.is_(False))
        stmt = stmt.order_by(Client.id.desc()).limit(limit).offset(offset)
        return list((await self._session.execute(stmt)).scalars().all())

    async def list_contacts(self, client_id: int) -> list[ClientContact]:
        stmt = (
            select(ClientContact)
            .where(ClientContact.client_id == client_id)
            .order_by(ClientContact.id)
        )
        return list((await self._session.execute(stmt)).scalars().all())
