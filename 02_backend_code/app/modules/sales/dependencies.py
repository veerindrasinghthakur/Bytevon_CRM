"""Sales module dependencies — domain services + UI facade."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.db.enums import LeadStatus
from app.modules.sales.domains.client.service import ClientService
from app.modules.sales.domains.lead.service import LeadService
from app.modules.sales.domains.platform.service import PlatformService


def get_client_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> ClientService:
    return ClientService(session)


def get_lead_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> LeadService:
    return LeadService(session)


def get_platform_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> PlatformService:
    return PlatformService(session)


ClientServiceDep = Annotated[ClientService, Depends(get_client_service)]
LeadServiceDep = Annotated[LeadService, Depends(get_lead_service)]
PlatformServiceDep = Annotated[PlatformService, Depends(get_platform_service)]


class SalesPublicService:
    """Thin facade for routes_ui / lead_ui that need both leads and clients."""

    def __init__(self, session: AsyncSession) -> None:
        self._leads = LeadService(session)
        self._clients = ClientService(session)
        self._platforms = PlatformService(session)

    async def list_leads(
        self,
        *,
        status: Optional[LeadStatus] = None,
        assigned_employment_id: Optional[int] = None,
        limit: int = 500,
        offset: int = 0,
    ):
        return await self._leads.list(
            status=status,
            assigned_employment_id=assigned_employment_id,
            limit=limit,
            offset=offset,
        )

    async def get_lead(self, lead_id: int):
        return await self._leads.get(lead_id)

    async def list_clients(self, *, include_archived: bool = False, limit: int = 100, offset: int = 0):
        return await self._clients.list(
            include_archived=include_archived, limit=limit, offset=offset
        )

    async def get_client(self, client_id: int):
        return await self._clients.get(client_id)

    async def list_platforms(self, *, include_archived: bool = False):
        return await self._platforms.list(include_archived=include_archived)


def get_sales_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SalesPublicService:
    return SalesPublicService(session)


SalesServiceDep = Annotated[SalesPublicService, Depends(get_sales_public_service)]
