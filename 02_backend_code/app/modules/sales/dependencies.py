"""Sales module dependencies — domain services + UI facade."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.db.enums import LeadStatus
from app.modules.sales.client.service import ClientService
from app.modules.sales.lead.service import LeadService
from app.modules.sales.source.service import SourceService
from app.modules.sales.activity.service import ActivityService
from app.modules.sales.case_study.service import CaseStudyService
from app.modules.sales.dashboard.service import DashboardService


def get_client_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> ClientService:
    return ClientService(session)


def get_lead_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> LeadService:
    return LeadService(session)


def get_source_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> SourceService:
    return SourceService(session)


def get_activity_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> ActivityService:
    return ActivityService(session)


def get_case_study_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> CaseStudyService:
    return CaseStudyService(session)


def get_dashboard_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> DashboardService:
    return DashboardService(session)


ClientServiceDep = Annotated[ClientService, Depends(get_client_service)]
LeadServiceDep = Annotated[LeadService, Depends(get_lead_service)]
SourceServiceDep = Annotated[SourceService, Depends(get_source_service)]
ActivityServiceDep = Annotated[ActivityService, Depends(get_activity_service)]
CaseStudyServiceDep = Annotated[CaseStudyService, Depends(get_case_study_service)]
DashboardServiceDep = Annotated[DashboardService, Depends(get_dashboard_service)]

# Back-compat alias (platforms were renamed to sources)
PlatformServiceDep = SourceServiceDep


class SalesPublicService:
    """Thin facade for routes_ui / lead_ui that need both leads and clients."""

    def __init__(self, session: AsyncSession) -> None:
        self._leads = LeadService(session)
        self._clients = ClientService(session)
        self._sources = SourceService(session)
        self._activity = ActivityService(session)
        self._case_studies = CaseStudyService(session)
        self._dashboard = DashboardService(session)

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
        return await self._sources.list(include_archived=include_archived)

    async def list_sources(self, *, include_archived: bool = False):
        return await self._sources.list(include_archived=include_archived)


def get_sales_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SalesPublicService:
    return SalesPublicService(session)


SalesServiceDep = Annotated[SalesPublicService, Depends(get_sales_public_service)]
