"""Compose / notify routes."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, status

from app.core.authorization import require_permission
from app.modules.notifications.compose.schemas import (
    ComposeBody,
    NotificationResponse,
    NotifyBulkRequest,
    NotifyRequest,
)
from app.modules.notifications.dependencies import ComposeServiceDep

router = APIRouter(prefix="/notifications", tags=["Notifications — Compose"])


@router.post(
    "/notify",
    response_model=NotificationResponse | None,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("notification", "CREATE", "ORGANIZATION"))],
)
async def notify(
    body: NotifyRequest,
    service: ComposeServiceDep,
) -> NotificationResponse | None:
    return await service.notify(body)


@router.post(
    "/notify/bulk",
    response_model=list[NotificationResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("notification", "CREATE", "ORGANIZATION"))],
)
async def notify_bulk(
    body: NotifyBulkRequest,
    service: ComposeServiceDep,
) -> list[NotificationResponse]:
    return await service.notify_bulk(body)


@router.post("/compose", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("notification", "CREATE", "ORGANIZATION"))])
async def compose(
    body: ComposeBody,
    service: ComposeServiceDep,
) -> dict[str, Any]:
    try:
        queued = await service.compose_broadcast(body)
        return {"queued": queued, "sentRows": []}
    except Exception:
        return {"queued": 0, "sentRows": []}

