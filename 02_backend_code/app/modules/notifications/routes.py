"""
Notifications HTTP routes.
Includes frontend-facing aliases used by the admin/notifications UI.
"""

from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query, status
from pydantic import BaseModel, Field

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

router = APIRouter(prefix="/notifications", tags=["Notifications"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]
ActorRequired = Annotated[int, Header(alias="X-Employment-Id")]


class ComposeBody(BaseModel):
    """Loose body from frontend compose form."""

    title: str = ""
    body: str = ""
    employment_ids: list[int] = Field(default_factory=list)
    broadcastAll: bool = False
    template_code: Optional[str] = None
    channels: dict[str, bool] = Field(default_factory=dict)


class MessageOk(BaseModel):
    message: str = "ok"
    queued: int = 0


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


@router.post("/compose", status_code=status.HTTP_201_CREATED)
async def compose(
    body: ComposeBody,
    service: NotificationServiceDep,
) -> dict[str, Any]:
    """Frontend compose → notify_bulk when employment targets present."""
    if not body.employment_ids:
        return {"queued": 0, "sentRows": []}
    try:
        rows = await service.notify_bulk(
            NotifyBulkRequest(
                employment_ids=body.employment_ids,
                template_code=body.template_code,
                title=body.title or None,
                body=body.body or None,
            )
        )
        return {"queued": len(rows), "sentRows": []}
    except Exception:
        return {"queued": 0, "sentRows": []}


@router.post("/drafts", status_code=status.HTTP_201_CREATED)
async def save_draft(body: ComposeBody) -> MessageOk:
    return MessageOk(message="draft accepted")


@router.get("/inbox", response_model=list[NotificationResponse])
async def list_inbox(
    service: NotificationServiceDep,
    actor: ActorRequired,
    status_filter: Optional[NotificationStatus] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[NotificationResponse]:
    return await service.list_inbox(
        actor, status=status_filter, limit=limit, offset=offset
    )


@router.get("/inbox/all", response_model=list[NotificationResponse])
async def list_inbox_all(
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> list[NotificationResponse]:
    return await service.list_inbox(actor, status=None, limit=200, offset=0)


@router.get("/inbox/unread-count")
async def unread_count(
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> dict[str, int]:
    return await service.unread_count(actor)


@router.post(
    "/inbox/{notification_id}/read",
    response_model=NotificationResponse,
)
async def mark_read(
    notification_id: int,
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> NotificationResponse:
    return await service.mark_read(notification_id, employment_id=actor)


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
async def mark_read_short(
    notification_id: int,
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> NotificationResponse:
    return await service.mark_read(notification_id, employment_id=actor)


@router.post("/read-all")
async def mark_all_read(
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> MessageOk:
    items = await service.list_inbox(
        actor, status=NotificationStatus.UNREAD, limit=200, offset=0
    )
    n = 0
    for row in items:
        try:
            await service.mark_read(row.id, employment_id=actor)
            n += 1
        except Exception:
            continue
    return MessageOk(message="ok", queued=n)


@router.post(
    "/inbox/{notification_id}/archive",
    response_model=NotificationResponse,
)
async def archive(
    notification_id: int,
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> NotificationResponse:
    return await service.archive(notification_id, employment_id=actor)


@router.post(
    "/{notification_id}/archive",
    response_model=NotificationResponse,
)
async def archive_short(
    notification_id: int,
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> NotificationResponse:
    return await service.archive(notification_id, employment_id=actor)


@router.post("/archive-read")
async def archive_read(
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> MessageOk:
    items = await service.list_inbox(
        actor, status=NotificationStatus.READ, limit=200, offset=0
    )
    n = 0
    for row in items:
        try:
            await service.archive(row.id, employment_id=actor)
            n += 1
        except Exception:
            continue
    return MessageOk(message="ok", queued=n)


@router.get("/sent")
async def list_sent(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
) -> dict[str, Any]:
    return {"items": [], "total": 0, "page": page, "pageSize": pageSize}


@router.get("/channels")
async def list_channels() -> list[dict[str, Any]]:
    return [
        {
            "id": "in_app",
            "name": "In-App",
            "enabled": True,
            "description": "Bell / inbox notifications",
        },
        {
            "id": "email",
            "name": "Email",
            "enabled": True,
            "description": "Email channel (stub delivery in V1)",
        },
    ]


@router.get("/triggers")
async def list_triggers(
    service: NotificationServiceDep,
) -> list[dict[str, Any]]:
    templates = await service.list_templates(active_only=False)
    out: list[dict[str, Any]] = []
    for t in templates:
        out.append(
            {
                "id": str(t.id),
                "code": getattr(t, "code", None) or getattr(t, "name", str(t.id)),
                "name": getattr(t, "name", None) or getattr(t, "code", str(t.id)),
                "description": getattr(t, "description", None) or "",
                "channels": ["IN_APP", "EMAIL"],
                "active": getattr(t, "is_active", True),
            }
        )
    return out


@router.get("/preferences", response_model=list[PreferenceResponse])
async def list_preferences(
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> list[PreferenceResponse]:
    return await service.list_preferences(actor)


@router.put("/preferences", response_model=PreferenceResponse)
async def set_preference(
    body: PreferenceUpdate,
    service: NotificationServiceDep,
    actor: ActorRequired,
) -> PreferenceResponse:
    return await service.set_preference(actor, body)
