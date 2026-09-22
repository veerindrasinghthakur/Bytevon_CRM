"""LeadService — leads + status change (WON flow)."""
from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import ClientType, LeadStatus
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.sales.client.repository import ClientRepository
from app.modules.sales.lead.repository import LeadRepository
from app.modules.sales.lead.schemas import (
    LeadCreate,
    LeadResponse,
    LeadStatusChange,
    LeadUpdate,
    LeadWonResponse,
)
from app.modules.sales.models import Client, Lead

logger = logging.getLogger(__name__)
_TERMINAL = {LeadStatus.WON, LeadStatus.LOST, LeadStatus.CLOSED}


class LeadService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = LeadRepository(session)
        self._clients = ClientRepository(session)

    async def create(self, data: LeadCreate, *, actor_employment_id: int | None = None) -> LeadResponse:
        lead = Lead(
            lead_title=data.lead_title,
            platform_id=data.platform_id,
            contact_name=data.contact_name,
            contact_title=data.contact_title,
            email=data.email,
            phone=data.phone,
            quotation=data.quotation,
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
        await self._session.refresh(lead)
        return LeadResponse.model_validate(lead)

    async def get(self, lead_id: int) -> LeadResponse:
        lead = await self._repo.get(lead_id)
        if lead is None:
            raise NotFoundError("Lead not found")
        return LeadResponse.model_validate(lead)

    async def list(
        self,
        *,
        status: LeadStatus | None = None,
        assigned_employment_id: int | None = None,
        limit: int = 500,
        offset: int = 0,
    ) -> list[LeadResponse]:
        rows = await self._repo.list(
            status=status,
            assigned_employment_id=assigned_employment_id,
            limit=limit,
            offset=offset,
        )
        return [LeadResponse.model_validate(r) for r in rows]

    async def update(
        self, lead_id: int, data: LeadUpdate, *, actor_employment_id: int | None = None
    ) -> LeadResponse:
        lead = await self._repo.get(lead_id)
        if lead is None:
            raise NotFoundError("Lead not found")
        if lead.status in _TERMINAL:
            raise DomainError(f"Cannot update lead in terminal status {lead.status}")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(lead, k, v)
        lead.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("lead.updated", lead_id, actor_employment_id)
        await self._session.refresh(lead)
        return LeadResponse.model_validate(lead)

    async def change_status(
        self, lead_id: int, data: LeadStatusChange, *, actor_employment_id: int | None = None
    ):
        lead = await self._repo.get(lead_id)
        if lead is None:
            raise NotFoundError("Lead not found")
        if lead.status in _TERMINAL:
            raise DomainError(f"Lead already in terminal status {lead.status}")
        if data.status == LeadStatus.WON:
            return await self._win_lead(
                lead, data, actor_employment_id=actor_employment_id
            )
        lead.status = data.status
        lead.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("lead.status_changed", lead_id, actor_employment_id)
        await self._session.refresh(lead)
        return LeadResponse.model_validate(lead)

    async def _win_lead(
        self,
        lead: Lead,
        data: LeadStatusChange,
        *,
        actor_employment_id: int | None = None,
    ) -> LeadWonResponse:
        """Q12: WON converts to Client; project creation is opt-in.

        Honors the status payload: explicit client_id reuse, client_name /
        client_type for the auto-created client, and auto_create_project
        (payload wins over the stored lead flag; default false).
        """
        from app.core.exceptions.exception import NotFoundError as _NotFound

        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        client_id = data.client_id or lead.client_id
        if client_id is None:
            name = (
                data.client_name or lead.contact_name or lead.lead_title or "Client"
            ).strip()
            client = Client(
                client_type=data.client_type or ClientType.COMPANY,
                client_name=name,
                changed_by=actor,
            )
            await self._clients.add(client)
            await self._session.flush()
            client_id = client.id
            lead.client_id = client_id
        else:
            existing_client = await self._clients.get_client(
                client_id, include_archived=True
            )
            if existing_client is None:
                raise _NotFound(f"Client not found (id={client_id})")
            lead.client_id = client_id
        lead.status = LeadStatus.WON
        lead.changed_by = actor
        project_id = None
        auto_project = (
            data.auto_create_project
            if data.auto_create_project is not None
            else bool(getattr(lead, "auto_create_project", False))
        )
        if auto_project:
            project_id = await self._try_create_project(lead, client_id, actor)
        await self._commit()
        await self._audit("lead.won", lead.id, actor_employment_id)
        await self._session.refresh(lead)
        return LeadWonResponse(
            lead=LeadResponse.model_validate(lead), client_id=client_id, project_id=project_id
        )

    async def _try_create_project(self, lead: Lead, client_id: int, actor: int) -> int | None:
        try:
            from app.modules.project.project.service import ProjectPublicService

            svc = ProjectPublicService(self._session)
            project = await svc.create_from_lead(
                lead_id=lead.id,
                client_id=client_id,
                title=lead.lead_title,
                actor_employment_id=actor,
                commit=False,
            )
            return project.id if project else None
        except Exception:
            logger.exception("create_from_lead failed for lead %s", lead.id)
            return None
