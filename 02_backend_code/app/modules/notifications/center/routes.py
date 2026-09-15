"""Center (inbox) routes under /notifications."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query

from app.core.db.enums import NotificationStatus
from app.modules.notifications.center.schemas import MessageResponse, NotificationResponse
from app.modules.notifications.dependencies import CenterServiceDep

router = APIRouter(prefix="/notifications", tags=["Notifications — Center"])

ActorRequired = Annotated[int, Header(alias="X-Employment-Id")]


@router.get("/inbox", response_model=list[NotificationResponse])
async def list_inbox(
    service: CenterServiceDep,
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
    service: CenterServiceDep,
    actor: ActorRequired,
) -> list[NotificationResponse]:
    return await service.list_inbox(actor, status=None, limit=200, offset=0)


@router.get("/inbox/unread-count")
async def unread_count(
    service: CenterServiceDep,
    actor: ActorRequired,
) -> dict[str, int]:
    return await service.unread_count(actor)


@router.post("/inbox/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: int,
    service: CenterServiceDep,
    actor: ActorRequired,
) -> NotificationResponse:
    return await service.mark_read(notification_id, employment_id=actor)


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read_short(
    notification_id: int,
    service: CenterServiceDep,
    actor: ActorRequired,
) -> NotificationResponse:
    return await service.mark_read(notification_id, employment_id=actor)


@router.post("/read-all", response_model=MessageResponse)
async def mark_all_read(
    service: CenterServiceDep,
    actor: ActorRequired,
) -> MessageResponse:
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
    return MessageResponse(message="ok", queued=n)


@router.post("/inbox/{notification_id}/archive", response_model=NotificationResponse)
async def archive(
    notification_id: int,
    service: CenterServiceDep,
    actor: ActorRequired,
) -> NotificationResponse:
    return await service.archive(notification_id, employment_id=actor)


@router.post("/{notification_id}/archive", response_model=NotificationResponse)
async def archive_short(
    notification_id: int,
    service: CenterServiceDep,
    actor: ActorRequired,
) -> NotificationResponse:
    return await service.archive(notification_id, employment_id=actor)


@router.post("/archive-read", response_model=MessageResponse)
async def archive_read(
    service: CenterServiceDep,
    actor: ActorRequired,
) -> MessageResponse:
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
    return MessageResponse(message="ok", queued=n)
