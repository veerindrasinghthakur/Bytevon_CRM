"""
SalesPublicService — only public entry point for Sales.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional, TypeVar

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import ClientType, LeadStatus
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.sales.models import Client, ClientContact, Lead, Platform
from app.modules.sales.repositories.repository import SalesRepository
from app.modules.sales.schemas.schemas import (
    ClientContactCreate,
    ClientContactResponse,
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    LeadCreate,
    LeadResponse,
    LeadStatusChange,
    LeadUpdate,
    LeadWonResponse,
    MessageResponse,
    PlatformCreate,
    PlatformResponse,
    PlatformUpdate,
)

logger = logging.getLogger(__name__)

_TERMINAL = {LeadStatus.WON, LeadStatus.LOST, LeadStatus.CLOSED}

T = TypeVar("T", bound=BaseModel)


class SalesPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = SalesRepository(session)

    async def _validate_after_commit(self, instance: object, schema: type[T]) -> T:
        await self._refresh(instance)
        return schema.model_validate(instance)

    async def create_client(
        self, data: ClientCreate, *, actor_employment_id: Optional[int] = None
    ) -> ClientResponse:
        client = Client(
            **data.model_dump(),
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(client)
        await self._commit()
        await self._audit("client.created", client.id, actor_employment_id)
        return await self._validate_after_commit(client, ClientResponse)

    async def get_client(self, client_id: int) -> ClientResponse:
        client = await self._repo.get_client_by_id(client_id)
        if client is None:
            raise NotFoundError("Client not found")
        return ClientResponse.model_validate(client)

    async def list_clients(
        self, *, include_archived: bool = False, limit: int = 100, offset: int = 0
    ) -> list[ClientResponse]:
        rows = await self._repo.list_clients(
            include_archived=include_archived, limit=limit, offset=offset
        )
        return [ClientResponse.model_validate(r) for r in rows]

    async def update_client(
        self, client_id: int, data: ClientUpdate, *, actor_employment_id: Optional[int] = None
    ) -> ClientResponse:
        client = await self._repo.get_client_by_id(client_id)
        if client is None:
            raise NotFoundError("Client not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(client, field, value)
        client.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("client.updated", client.id, actor_employment_id)
        return await self._validate_after_commit(client, ClientResponse)

    async def archive_client(
        self, client_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        client = await self._repo.get_client_by_id(client_id)
        if client is None:
            raise NotFoundError("Client not found")
        if client.is_archived:
            raise DomainError("Client is already archived")
        now = datetime.now(timezone.utc)
        client.is_archived = True
        client.archived_at = now
        client.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        client.changed_by = client.archived_by
        await self._commit()
        await self._audit("client.archived", client.id, actor_employment_id)
        return MessageResponse(message="Client archived")

    async def add_contact(
        self, data: ClientContactCreate, *, actor_employment_id: Optional[int] = None
    ) -> ClientContactResponse:
        client = await self._repo.get_client_by_id(data.client_id)
        if client is None:
            raise NotFoundError("Client not found")
        contact = ClientContact(
            **data.model_dump(),
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(contact)
        await self._commit()
        await self._audit("client_contact.created", contact.id, actor_employment_id)
        return await self._validate_after_commit(contact, ClientContactResponse)

    async def list_contacts(self, client_id: int) -> list[ClientContactResponse]:
        client = await self._repo.get_client_by_id(data.client_id)
        if client is None:
            raise NotFoundError("Client not found")
        rows = await self._repo.list_contacts_for_client(client_id)
        return [ClientContactResponse.model_validate(r) for r in rows]
