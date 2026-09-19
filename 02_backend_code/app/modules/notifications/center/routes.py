"""Center (inbox) routes under /notifications."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.authorization import AuthContext, require_permission
from app.core.db.enums import NotificationStatus
from app.modules.notifications.center.schemas import MessageResponse, NotificationResponse
from app.modules.notifications.dependencies import CenterServiceDep

router = APIRouter(prefix="/notifications", tags=["Notifications — Center"])


@router.get("/inbox", response_model=list[NotificationResponse])
async def list_inbox(
    service: CenterServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "VIEW", "SELF"))],
    status_filter: NotificationStatus | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[NotificationResponse]:
    return await service.list_inbox(
        auth.employment_id, status=status_filter, limit=limit, offset=offset
    )


@router.get("/inbox/all", response_model=list[NotificationResponse])
async def list_inbox_all(
    service: CenterServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "VIEW", "SELF"))],
) -> list[NotificationResponse]:
    return await service.list_inbox(auth.employment_id, status=None, limit=200, offset=0)


@router.get("/inbox/unread-count")
async def unread_count(
    service: CenterServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "VIEW", "SELF"))],
) -> dict[str, int]:
    return await service.unread_count(auth.employment_id)


@router.post("/inbox/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: int,
    service: CenterServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "UPDATE", "SELF"))],
) -> NotificationResponse:
    return await service.mark_read(notification_id, employment_id=auth.employment_id)


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read_short(
    notification_id: int,
    service: CenterServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "UPDATE", "SELF"))],
) -> NotificationResponse:
    return await service.mark_read(notification_id, employment_id=auth.employment_id)


@router.post("/read-all", response_model=MessageResponse)
async def mark_all_read(
    service: CenterServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "UPDATE", "SELF"))],
) -> MessageResponse:
    items = await service.list_inbox(
        auth.employment_id, status=NotificationStatus.UNREAD, limit=200, offset=0
    )
    n = 0
    for row in items:
        try:
            await service.mark_read(row.id, employment_id=auth.employment_id)
            n += 1
        except Exception:
            continue
    return MessageResponse(message="ok", queued=n)


@router.post("/inbox/{notification_id}/archive", response_model=NotificationResponse)
async def archive(
    notification_id: int,
    service: CenterServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "UPDATE", "SELF"))],
) -> NotificationResponse:
    return await service.archive(notification_id, employment_id=auth.employment_id)


@router.post("/{notification_id}/archive", response_model=NotificationResponse)
async def archive_short(
    notification_id: int,
    service: CenterServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "UPDATE", "SELF"))],
) -> NotificationResponse:
    return await service.archive(notification_id, employment_id=auth.employment_id)


@router.post("/archive-read", response_model=MessageResponse)
async def archive_read(
    service: CenterServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("notification", "UPDATE", "SELF"))],
) -> MessageResponse:
    items = await service.list_inbox(
        auth.employment_id, status=NotificationStatus.READ, limit=200, offset=0
    )
    n = 0
    for row in items:
        try:
            await service.archive(row.id, employment_id=auth.employment_id)
            n += 1
        except Exception:
            continue
    return MessageResponse(message="ok", queued=n)
