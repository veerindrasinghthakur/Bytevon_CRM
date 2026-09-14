"""Sales module dependencies — domain service deps."""
from __future__ import annotations
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
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

# Backward-compat for routes_ui / lead_ui during migration
SalesServiceDep = LeadServiceDep
