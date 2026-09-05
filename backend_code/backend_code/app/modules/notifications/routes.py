"""
Notifications HTTP routes.
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import NotificationStatus
from app.modules.notifications.dependencies import NotificationServiceDep
from app.modules.notifications.schemas.schemas import (
    NotificationResponse,
    NotificationTemplateCreate,
    NotificationTemplateResponse,
    NotificationTemplateUpdate,
    NotifyBulkRequest,
    NotifyRequest,
    PreferenceResponse,
    PreferenceUpdate,
)

# Optional is used in response_model for notify endpoint

router = APIRouter(prefix="/notifications", tags=["Notifications"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


# ---------------------------------------------------------------------------
# Templates (admin)
# ---------------------------------------------------------------------------

@router.post(
    "/templates",
    response_model=NotificationTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_template(
    body: NotificationTemplateCreate,
    service: NotificationServiceDep,
    actor: ActorHeader = None,
) -> NotificationTemplateResponse:
    return await service.create_template(body, actor_employment_id=actor)


@router.get("/templates", response_model=list[NotificationTemplateResponse])
async def list_templates(
    service: NotificationServiceDep,
    active_only: bool = Query(False),
) -> list[NotificationTemplateResponse]:
    return await service.list_templates(active_only=active_only)


@router.get("/templates/{template_id}", response_model=NotificationTemplateResponse)
async def get_template(
    template_id: int,
    service: NotificationServiceDep,
) -> NotificationTemplateResponse:
    return await service.get_template(template_id)


@router.patch(
    "/templates/{template_id}",
    response_model=NotificationTemplateResponse,
)
async def update_template(
    template_id: int,
    body: NotificationTemplateUpdate,
    service: NotificationServiceDep,
    actor: ActorHeader = None,
) -> NotificationTemplateResponse:
    return await service.update_template(
        template_id, body, actor_employment_id=actor
    )


# ---------------------------------------------------------------------------
# Internal-style notify endpoints (also callable by other services in-process)
# ---------------------------------------------------------------------------

@router.post(
    "/notify",
    response_model=Optional[NotificationResponse],
    status_code=status.HTTP_201_CREATED,
)
async def notify(
    body: NotifyRequest,
    service: NotificationServiceDep,
) -> Optional[NotificationResponse]:
    return await service.notify(body)


@router.post(
    "/notify/bulk",
    response_model=list[NotificationResponse],
    status_code=status.HTTP_201_CREATED,
)
async def notify_bulk(
    body: NotifyBulkRequest,
    service: NotificationServiceDep,
) -> list[NotificationResponse]:
    return await service.notify_bulk(body)


# ---------------------------------------------------------------------------
# Inbox
# ---------------------------------------------------------------------------

@router.get("/inbox", response_model=list[NotificationResponse])
async def list_inbox(
    service: NotificationServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
    status_filter: Optional[NotificationStatus] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[NotificationResponse]:
    return await service.list_inbox(
        actor, status=status_filter, limit=limit, offset=offset
    )


@router.get("/inbox/unread-count")
async def unread_count(
    service: NotificationServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
) -> dict[str, int]:
    return await service.unread_count(actor)


@router.post(
    "/inbox/{notification_id}/read",
    response_model=NotificationResponse,
)
async def mark_read(
    notification_id: int,
    service: NotificationServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
) -> NotificationResponse:
    return await service.mark_read(notification_id, employment_id=actor)


@router.post(
    "/inbox/{notification_id}/archive",
    response_model=NotificationResponse,
)
async def archive(
    notification_id: int,
    service: NotificationServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
) -> NotificationResponse:
    return await service.archive(notification_id, employment_id=actor)


# ---------------------------------------------------------------------------
# Preferences
# ---------------------------------------------------------------------------

@router.get("/preferences", response_model=list[PreferenceResponse])
async def list_preferences(
    service: NotificationServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
) -> list[PreferenceResponse]:
    return await service.list_preferences(actor)


@router.put("/preferences", response_model=PreferenceResponse)
async def set_preference(
    body: PreferenceUpdate,
    service: NotificationServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
) -> PreferenceResponse:
    return await service.set_preference(actor, body)
