"""Notification draft routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.notifications.drafts.schemas import (
    NotificationDraftCreate,
    NotificationDraftResponse,
    NotificationDraftUpdate,
)
from app.modules.notifications.drafts.service import DraftService

router = APIRouter(prefix="/notifications", tags=["Notifications — Drafts"])


def _service(session=Depends(get_db_session)) -> DraftService:
    return DraftService(session)


@router.get("/drafts", response_model=list[NotificationDraftResponse])
async def list_drafts(
    service: Annotated[DraftService, Depends(_service)],
    auth: Annotated[AuthContext, Depends(require_permission("notification", "CREATE", "SELF"))],
) -> list[NotificationDraftResponse]:
    return await service.list_drafts(auth.employment_id)


@router.post("/drafts", response_model=NotificationDraftResponse, status_code=status.HTTP_201_CREATED)
async def create_draft(
    body: NotificationDraftCreate,
    service: Annotated[DraftService, Depends(_service)],
    auth: Annotated[AuthContext, Depends(require_permission("notification", "CREATE", "SELF"))],
) -> NotificationDraftResponse:
    return await service.create_draft(body, owner_employment_id=auth.employment_id)


@router.put("/drafts/{draft_id}", response_model=NotificationDraftResponse)
async def update_draft(
    draft_id: int,
    body: NotificationDraftUpdate,
    service: Annotated[DraftService, Depends(_service)],
    auth: Annotated[AuthContext, Depends(require_permission("notification", "CREATE", "SELF"))],
) -> NotificationDraftResponse:
    return await service.update_draft(draft_id, body, owner_employment_id=auth.employment_id)


@router.delete("/drafts/{draft_id}")
async def delete_draft(
    draft_id: int,
    service: Annotated[DraftService, Depends(_service)],
    auth: Annotated[AuthContext, Depends(require_permission("notification", "CREATE", "SELF"))],
) -> dict[str, bool]:
    await service.delete_draft(draft_id, owner_employment_id=auth.employment_id)
    return {"deleted": True}
