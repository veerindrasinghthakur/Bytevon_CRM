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
        client = await self._repo.get_client_by_id(client_id)
        if client is None:
            raise NotFoundError("Client not found")
        rows = await self._repo.list_contacts_for_client(client_id)
        return [ClientContactResponse.model_validate(r) for r in rows]

    # ------------------------------------------------------------------
    # Platforms (lead sources)
    # ------------------------------------------------------------------

    async def create_platform(
        self, data: PlatformCreate, *, actor_employment_id: Optional[int] = None
    ) -> PlatformResponse:
        existing = await self._repo.find_platform_by_name(data.name)
        if existing is not None:
            raise ConflictError(f"Source '{data.name}' already exists")
        platform = Platform(
            **data.model_dump(),
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(platform)
        await self._commit()
        await self._audit("platform.created", platform.id, actor_employment_id)
        return await self._validate_after_commit(platform, PlatformResponse)

    async def get_platform(self, platform_id: int) -> PlatformResponse:
        platform = await self._repo.get_platform_by_id(platform_id, include_archived=True)
        if platform is None:
            raise NotFoundError("Platform not found")
        return PlatformResponse.model_validate(platform)

    async def list_platforms(self, *, include_archived: bool = False) -> list[PlatformResponse]:
        rows = await self._repo.list_platforms(include_archived=include_archived)
        return [PlatformResponse.model_validate(r) for r in rows]

    async def list_platforms_with_stats(
        self, *, include_archived: bool = False
    ) -> dict[str, Any]:
        rows = await self._repo.list_platforms(include_archived=include_archived)
        counts = await self._repo.count_leads_by_platform()
        items: list[dict[str, Any]] = []
        for r in rows:
            lead_count = counts.get(r.id, 0)
            items.append(
                {
                    "id": r.id,
                    "name": r.name,
                    "description": r.description,
                    "is_archived": r.is_archived,
                    "leadCount": lead_count,
                    "lead_count": lead_count,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                    "status": "Archived" if r.is_archived else "Active",
                }
            )
        active = [i for i in items if not i["is_archived"]]
        top = max(active, key=lambda x: x["leadCount"], default=None)
        total_leads = sum(i["leadCount"] for i in items)
        return {
            "items": items,
            "total": len(items),
            "metrics": [
                {
                    "id": "total",
                    "label": "Total sources",
                    "value": str(len(active)),
                    "icon": "hub",
                },
                {
                    "id": "top",
                    "label": "Source with highest leads",
                    "value": (
                        f"{top['name']} ({top['leadCount']})"
                        if top and top["leadCount"] > 0
                        else "—"
                    ),
                    "icon": "emoji_events",
                },
                {
                    "id": "leads",
                    "label": "Leads with source",
                    "value": str(total_leads),
                    "icon": "person_search",
                },
                {
                    "id": "archived",
                    "label": "Archived sources",
                    "value": str(sum(1 for i in items if i["is_archived"])),
                    "icon": "inventory_2",
                },
            ],
        }

    async def update_platform(
        self, platform_id: int, data: PlatformUpdate, *, actor_employment_id: Optional[int] = None
    ) -> PlatformResponse:
        platform = await self._repo.get_platform_by_id(platform_id, include_archived=True)
        if platform is None:
            raise NotFoundError("Platform not found")
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload and payload["name"]:
            dup = await self._repo.find_platform_by_name(
                payload["name"], exclude_id=platform_id
            )
            if dup is not None:
                raise ConflictError(f"Source '{payload['name']}' already exists")
        for field, value in payload.items():
            setattr(platform, field, value)
        platform.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("platform.updated", platform.id, actor_employment_id)
        return await self._validate_after_commit(platform, PlatformResponse)

    async def archive_platform(
        self, platform_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        platform = await self._repo.get_platform_by_id(platform_id, include_archived=True)
        if platform is None:
            raise NotFoundError("Platform not found")
        if platform.is_archived:
            raise DomainError("Platform is already archived")
        now = datetime.now(timezone.utc)
        platform.is_archived = True
        platform.archived_at = now
        platform.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        platform.changed_by = platform.archived_by
        await self._commit()
        await self._audit("platform.archived", platform.id, actor_employment_id)
        return MessageResponse(message="Platform archived")

    async def create_lead(
        self, data: LeadCreate, *, actor_employment_id: Optional[int] = None
    ) -> LeadResponse:
        if data.platform_id is not None:
            p = await self._repo.get_platform_by_id(data.platform_id)
            if p is None:
                raise NotFoundError("Platform not found")
        if data.client_id is not None:
            c = await self._repo.get_client_by_id(data.client_id)
            if c is None:
                raise NotFoundError("Client not found")
        if data.status == LeadStatus.WON:
            raise DomainError("Create lead as WON via status change endpoint")

        lead = Lead(
            lead_title=data.lead_title,
            platform_id=data.platform_id,
            contact_name=data.contact_name,
            contact_title=data.contact_title,
            email=str(data.email) if data.email else None,
            phone=data.phone,
            quotation=data.quotation,
            expected_close_date=data.expected_close_date,
            assigned_employment_id=data.assigned_employment_id,
            status=data.status,
            priority=data.priority,
            description=data.description,
            chat_link=data.chat_link,
            client_id=data.client_id,
            auto_create_project=data.auto_create_project,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(lead)
        await self._commit()
        await self._audit("lead.created", lead.id, actor_employment_id)
        return await self._validate_after_commit(lead, LeadResponse)

    async def get_lead(self, lead_id: int) -> LeadResponse:
        lead = await self._repo.get_lead_by_id(lead_id)
        if lead is None:
            raise NotFoundError("Lead not found")
        return LeadResponse.model_validate(lead)

    async def list_leads(
        self,
        *,
        status: Optional[LeadStatus] = None,
        assigned_employment_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[LeadResponse]:
        rows = await self._repo.list_leads(
            status=status,
            assigned_employment_id=assigned_employment_id,
            limit=limit,
            offset=offset,
        )
        return [LeadResponse.model_validate(r) for r in rows]

    async def update_lead(
        self, lead_id: int, data: LeadUpdate, *, actor_employment_id: Optional[int] = None
    ) -> LeadResponse:
        lead = await self._repo.get_lead_by_id(lead_id)
        if lead is None:
            raise NotFoundError("Lead not found")
        if lead.status in _TERMINAL:
            raise DomainError(f"Cannot update lead in terminal status {lead.status.value}")

        payload = data.model_dump(exclude_unset=True)
        if "email" in payload and payload["email"] is not None:
            payload["email"] = str(payload["email"])
        payload.pop("client_type", None)
        payload.pop("client_name", None)

        new_status = payload.pop("status", None)
        if new_status is not None:
            if new_status == LeadStatus.WON:
                raise DomainError("Mark WON via POST /sales/leads/{id}/status")
            if new_status in _TERMINAL and new_status != lead.status:
                pass
            lead.status = new_status

        for field, value in payload.items():
            setattr(lead, field, value)
        lead.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("lead.updated", lead.id, actor_employment_id)
        return await self._validate_after_commit(lead, LeadResponse)

    async def change_lead_status(
        self, lead_id: int, data: LeadStatusChange, *, actor_employment_id: Optional[int] = None
    ) -> LeadResponse | LeadWonResponse:
        lead = await self._repo.get_lead_by_id(lead_id)
        if lead is None:
            raise NotFoundError("Lead not found")

        if lead.status in _TERMINAL and data.status != lead.status:
            raise DomainError(
                f"Cannot change status from terminal state {lead.status.value}"
            )

        if data.status == LeadStatus.WON:
            return await self._win_lead(lead, data, actor_employment_id=actor_employment_id)

        lead.status = data.status
        lead.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("lead.status_changed", lead.id, actor_employment_id)
        return await self._validate_after_commit(lead, LeadResponse)

    async def _win_lead(
        self, lead: Lead, data: LeadStatusChange, *, actor_employment_id: Optional[int]
    ) -> LeadWonResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID

        client_id = data.client_id or lead.client_id
        if client_id is not None:
            client = await self._repo.get_client_by_id(client_id)
            if client is None:
                raise NotFoundError("Client not found")
        else:
            client_name = data.client_name or lead.contact_name or lead.lead_title
            client_type = data.client_type or ClientType.COMPANY
            client = Client(
                client_type=client_type,
                client_name=client_name,
                changed_by=actor,
            )
            await self._repo.add(client)
            await self._flush()

            contact = ClientContact(
                client_id=client.id,
                name=lead.contact_name,
                designation=lead.contact_title,
                email=lead.email,
                phone=lead.phone,
                changed_by=actor,
            )
            await self._repo.add(contact)

        lead.client_id = client.id
        lead.status = LeadStatus.WON
        if data.auto_create_project is not None:
            lead.auto_create_project = data.auto_create_project
        lead.changed_by = actor

        project_id: Optional[int] = None
        project_created = False
        if lead.auto_create_project:
            project_id = await self._try_create_project_from_lead(lead, client.id, actor)
            project_created = project_id is not None

        await self._commit()
        await self._audit("lead.won", lead.id, actor_employment_id)
        await self._notify_won(lead, client.id, project_id)

        return LeadWonResponse(
            lead=await self._validate_after_commit(lead, LeadResponse),
            client=await self._validate_after_commit(client, ClientResponse),
            project_id=project_id,
            project_created=project_created,
        )

    async def _try_create_project_from_lead(
        self, lead: Lead, client_id: int, actor: int
    ) -> Optional[int]:
        try:
            from app.modules.project.services.public_service import ProjectPublicService

            project_svc = ProjectPublicService(self._session)
            project = await project_svc.create_from_lead(
                lead_id=lead.id,
                client_id=client_id,
                title=lead.lead_title,
                actor_employment_id=actor,
                commit=False,
            )
            return project.id if project else None
        except ImportError:
            logger.warning("Developer module not available; skip project for lead %s", lead.id)
            return None
        except Exception:
            logger.exception("create_from_lead failed for lead %s", lead.id)
            return None

    async def _notify_won(self, lead: Lead, client_id: int, project_id: Optional[int]) -> None:
        try:
            from app.modules.notifications.schemas.schemas import NotifyRequest
            from app.modules.notifications.services.public_service import NotificationPublicService
            from app.core.db.enums import NotificationRecipientType

            if lead.assigned_employment_id:
                notif = NotificationPublicService(self._session)
                await notif.notify(
                    NotifyRequest(
                        recipient_type=NotificationRecipientType.EMPLOYMENT,
                        recipient_id=lead.assigned_employment_id,
                        title=f"Lead won: {lead.lead_title}",
                        body=(
                            f"Lead '{lead.lead_title}' marked WON. Client #{client_id}"
                            + (f", Project #{project_id}" if project_id else "")
                        ),
                        payload={
                            "lead_id": lead.id,
                            "client_id": client_id,
                            "project_id": project_id,
                        },
                    )
                )
        except Exception:
            logger.exception("Failed to notify on lead WON")
