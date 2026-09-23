"""LeadService — leads + status change (WON flow)."""
from __future__ import annotations

import logging
from datetime import UTC, datetime

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
    MessageResponse,
)
from app.modules.sales.models import Client, Lead

logger = logging.getLogger(__name__)
_TERMINAL = {LeadStatus.WON, LeadStatus.LOST, LeadStatus.CLOSED}


class LeadService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = LeadRepository(session)
        self._clients = ClientRepository(session)

    async def _enrich_leads(self, leads: list[Lead]) -> list[LeadResponse]:
        """Batch platform + assignee names (no N+1)."""
        from sqlalchemy import select

        from app.modules.auth.models import Person
        from app.modules.sales.models import Platform
        from app.modules.workforce.models import Employment

        platform_ids = {l.platform_id for l in leads if l.platform_id}
        platforms: dict[int, str] = {}
        if platform_ids:
            rows = (
                await self._session.execute(
                    select(Platform).where(Platform.id.in_(platform_ids))
                )
            ).scalars()
            platforms = {p.id: p.name for p in rows}
        emp_ids = {l.assigned_employment_id for l in leads if l.assigned_employment_id}
        assignees: dict[int, str] = {}
        if emp_ids:
            emps = (
                await self._session.execute(
                    select(Employment).where(Employment.id.in_(emp_ids))
                )
            ).scalars()
            emp_list = list(emps)
            persons = (
                await self._session.execute(
                    select(Person).where(Person.id.in_({e.person_id for e in emp_list}))
                )
            ).scalars()
            names = {p.id: f"{p.first_name} {p.last_name}".strip() for p in persons}
            for e in emp_list:
                assignees[e.id] = names.get(e.person_id) or e.employee_code
        out: list[LeadResponse] = []
        for lead in leads:
            resp = LeadResponse.model_validate(lead)
            resp.platform_name = platforms.get(lead.platform_id) if lead.platform_id else None
            resp.assignee_name = (
                assignees.get(lead.assigned_employment_id)
                if lead.assigned_employment_id
                else None
            )
            out.append(resp)
        return out

    async def _lead_response(self, lead: Lead) -> LeadResponse:
        enriched = await self._enrich_leads([lead])
        return enriched[0]

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
        await self._audit(
            "lead.created",
            lead.id,
            actor_employment_id,
            description=f"Lead created with status {data.status.value if hasattr(data.status, 'value') else data.status}",
        )
        await self._session.refresh(lead)
        return await self._lead_response(lead)

    async def get(self, lead_id: int) -> LeadResponse:
        lead = await self._repo.get(lead_id)
        if lead is None:
            raise NotFoundError("Lead not found")
        return await self._lead_response(lead)

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
        return await self._enrich_leads(list(rows))

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
        await self._audit(
            "lead.updated", lead_id, actor_employment_id, description="Lead updated"
        )
        await self._session.refresh(lead)
        return await self._lead_response(lead)

    async def delete_lead(
        self, lead_id: int, *, actor_employment_id: int | None = None
    ) -> dict:
        """Soft-delete a lead: archive + sync status to CLOSED (single call)."""
        lead = await self._repo.get(lead_id)
        if lead is None:
            raise NotFoundError("Lead not found")
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        lead.is_archived = True
        lead.archived_at = datetime.now(UTC)
        lead.archived_by = actor
        lead.status = LeadStatus.CLOSED
        lead.changed_by = actor
        await self._commit()
        await self._audit(
            "lead.deleted",
            lead_id,
            actor_employment_id,
            description="Lead deleted (archived, status synced to CLOSED)",
        )
        await self._session.refresh(lead)
        return MessageResponse(message="Lead deleted").model_dump()

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
        old = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
        new = data.status.value if hasattr(data.status, "value") else str(data.status)
        lead.status = data.status
        lead.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit(
            "lead.status_changed",
            lead_id,
            actor_employment_id,
            description=f"Status changed from {old} to {new}",
        )
        await self._session.refresh(lead)
        return await self._lead_response(lead)

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
        old_status = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
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
        await self._audit(
            "lead.won",
            lead.id,
            actor_employment_id,
            description=f"Lead won (status {old_status} to WON)",
        )
        await self._session.refresh(lead)
        return LeadWonResponse(
            lead=await self._lead_response(lead), client_id=client_id, project_id=project_id
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

