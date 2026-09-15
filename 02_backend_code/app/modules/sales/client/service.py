"""ClientService — clients + contacts."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.sales.models import Client, ClientContact
from app.modules.sales.client.repository import ClientRepository
from app.modules.sales.client.schemas import (
    ClientContactCreate,
    ClientContactResponse,
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    MessageResponse,
)


class ClientService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ClientRepository(session)

    async def create(self, data: ClientCreate, *, actor_employment_id: Optional[int] = None) -> ClientResponse:
        client = Client(**data.model_dump(), changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID)
        await self._repo.add(client)
        await self._commit()
        await self._audit("client.created", client.id, actor_employment_id)
        await self._session.refresh(client)
        return ClientResponse.model_validate(client)

    async def get(self, client_id: int) -> ClientResponse:
        client = await self._repo.get_client(client_id, include_archived=True)
        if client is None:
            raise NotFoundError("Client not found")
        return ClientResponse.model_validate(client)

    async def list(self, *, include_archived: bool = False, limit: int = 100, offset: int = 0) -> list[ClientResponse]:
        rows = await self._repo.list_clients(include_archived=include_archived, limit=limit, offset=offset)
        return [ClientResponse.model_validate(r) for r in rows]

    async def update(self, client_id: int, data: ClientUpdate, *, actor_employment_id: Optional[int] = None) -> ClientResponse:
        client = await self._repo.get_client(client_id, include_archived=True)
        if client is None:
            raise NotFoundError("Client not found")
        if client.is_archived:
            raise DomainError("Cannot update archived client")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(client, k, v)
        client.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("client.updated", client_id, actor_employment_id)
        await self._session.refresh(client)
        return ClientResponse.model_validate(client)

    async def archive(self, client_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        client = await self._repo.get_client(client_id, include_archived=True)
        if client is None:
            raise NotFoundError("Client not found")
        if client.is_archived:
            return MessageResponse(message="Client already archived")
        client.is_archived = True
        client.archived_at = datetime.now(timezone.utc)
        client.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("client.archived", client_id, actor_employment_id)
        return MessageResponse(message="Client archived")

    async def add_contact(self, data: ClientContactCreate, *, actor_employment_id: Optional[int] = None) -> ClientContactResponse:
        client = await self._repo.get_client(data.client_id, include_archived=False)
        if client is None:
            raise NotFoundError("Client not found")
        contact = ClientContact(**data.model_dump(), changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID)
        await self._repo.add(contact)
        await self._commit()
        await self._audit("client_contact.created", contact.id, actor_employment_id)
        await self._session.refresh(contact)
        return ClientContactResponse.model_validate(contact)

    async def list_contacts(self, client_id: int) -> list[ClientContactResponse]:
        client = await self._repo.get_client(client_id, include_archived=True)
        if client is None:
            raise NotFoundError("Client not found")
        rows = await self._repo.list_contacts(client_id)
        return [ClientContactResponse.model_validate(r) for r in rows]
