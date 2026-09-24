"""Organization settings routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.admin.settings.schemas import OrganizationSettingsResponse, OrganizationSettingsUpdate
from app.modules.admin.settings.service import SettingsService

router = APIRouter(prefix="/settings", tags=["Admin / Settings"])

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> SettingsService:
    return SettingsService(session)

ServiceDep = Annotated[SettingsService, Depends(get_service)]

@router.get("", response_model=OrganizationSettingsResponse, dependencies=[Depends(require_permission("org_settings", "VIEW", "ORGANIZATION"))])
async def get_settings(service: ServiceDep) -> OrganizationSettingsResponse:
    return await service.get()

@router.patch("", response_model=OrganizationSettingsResponse)
@router.put("", response_model=OrganizationSettingsResponse, dependencies=[Depends(require_permission("org_settings", "UPDATE", "ORGANIZATION"))])
async def upsert_settings(body: OrganizationSettingsUpdate, service: ServiceDep, auth: Annotated[AuthContext, Depends(require_permission("org_settings", "UPDATE", "ORGANIZATION"))]) -> OrganizationSettingsResponse:
    return await service.upsert(body, actor_employment_id=auth.employment_id)
