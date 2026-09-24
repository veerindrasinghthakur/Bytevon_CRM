"""Settings routes (channels)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.authorization import require_permission
from app.modules.notifications.dependencies import SettingsServiceDep
from app.modules.notifications.settings.schemas import ChannelInfo

router = APIRouter(prefix="/notifications", tags=["Notifications — Settings"])


@router.get("/channels", response_model=list[ChannelInfo], dependencies=[Depends(require_permission("notification", "VIEW", "ORGANIZATION"))])
async def list_channels(service: SettingsServiceDep) -> list[ChannelInfo]:
    return await service.list_channels()
