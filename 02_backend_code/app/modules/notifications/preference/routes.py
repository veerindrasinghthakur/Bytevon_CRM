"""Preference routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Header

from app.modules.notifications.dependencies import PreferenceServiceDep
from app.modules.notifications.preference.schemas import (
    PreferenceResponse,
    PreferenceUpdate,
)

router = APIRouter(prefix="/notifications", tags=["Notifications — Preferences"])

ActorRequired = Annotated[int, Header(alias="X-Employment-Id")]


@router.get("/preferences", response_model=list[PreferenceResponse])
async def list_preferences(
    service: PreferenceServiceDep,
    actor: ActorRequired,
) -> list[PreferenceResponse]:
    return await service.list_preferences(actor)


@router.put("/preferences", response_model=PreferenceResponse)
async def set_preference(
    body: PreferenceUpdate,
    service: PreferenceServiceDep,
    actor: ActorRequired,
) -> PreferenceResponse:
    return await service.set_preference(actor, body)
