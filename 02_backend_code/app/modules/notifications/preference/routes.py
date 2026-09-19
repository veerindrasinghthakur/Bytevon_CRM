"""Preference routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.authorization import AuthContext, require_permission
from app.modules.notifications.dependencies import PreferenceServiceDep
from app.modules.notifications.preference.schemas import (
    PreferenceResponse,
    PreferenceUpdate,
)

router = APIRouter(prefix="/notifications", tags=["Notifications — Preferences"])


@router.get("/preferences", response_model=list[PreferenceResponse])
async def list_preferences(
    service: PreferenceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "VIEW", "SELF"))],
) -> list[PreferenceResponse]:
    return await service.list_preferences(auth.employment_id)


@router.put("/preferences", response_model=PreferenceResponse)
async def set_preference(
    body: PreferenceUpdate,
    service: PreferenceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "UPDATE", "SELF"))],
) -> PreferenceResponse:
    return await service.set_preference(auth.employment_id, body)
