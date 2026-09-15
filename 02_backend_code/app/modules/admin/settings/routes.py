"""Organization settings routes."""
from __future__ import annotations
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.admin.settings.schemas import OrganizationSettingsResponse, OrganizationSettingsUpdate
from app.modules.admin.settings.service import SettingsService

router = APIRouter(prefix="/settings", tags=["Admin / Settings"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> SettingsService:
    return SettingsService(session)

ServiceDep = Annotated[SettingsService, Depends(get_service)]

@router.get("", response_model=OrganizationSettingsResponse)
async def get_settings(service: ServiceDep) -> OrganizationSettingsResponse:
    return await service.get()

@router.patch("", response_model=OrganizationSettingsResponse)
@router.put("", response_model=OrganizationSettingsResponse)
async def upsert_settings(body: OrganizationSettingsUpdate, service: ServiceDep, actor: ActorHeader = None) -> OrganizationSettingsResponse:
    return await service.upsert(body, actor_employment_id=actor)
