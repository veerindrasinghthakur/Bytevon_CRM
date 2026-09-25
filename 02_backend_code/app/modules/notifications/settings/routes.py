"""Settings routes (channels + global settings)."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.notifications.dependencies import SettingsServiceDep
from app.modules.notifications.settings.global_service import GlobalSettingsService
from app.modules.notifications.settings.schemas import ChannelInfo

router = APIRouter(prefix="/notifications", tags=["Notifications — Settings"])


@router.get("/channels", response_model=list[ChannelInfo], dependencies=[Depends(require_permission("notification", "VIEW", "ORGANIZATION"))])
async def list_channels(service: SettingsServiceDep) -> list[ChannelInfo]:
    return await service.list_channels()


def _global(session=Depends(get_db_session)) -> GlobalSettingsService:
    return GlobalSettingsService(session)


@router.get("/settings")
async def get_settings(
    service: Annotated[GlobalSettingsService, Depends(_global)],
    auth: Annotated[AuthContext, Depends(require_permission("notification", "VIEW", "ORGANIZATION"))],
) -> dict[str, Any]:
    return await service.get_settings()


@router.put("/settings")
async def update_settings(
    patch: dict[str, Any],
    service: Annotated[GlobalSettingsService, Depends(_global)],
    auth: Annotated[AuthContext, Depends(require_permission("notification", "UPDATE", "ORGANIZATION"))],
) -> dict[str, Any]:
    return await service.update_settings(patch, actor_employment_id=auth.employment_id)
