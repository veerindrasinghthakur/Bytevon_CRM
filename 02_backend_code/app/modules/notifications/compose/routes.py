"""Compose / notify routes."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, status

from app.core.authorization import require_permission
from app.modules.notifications.compose.schemas import (
    ComposeBody,
    MessageResponse,
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


@router.post("/drafts", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("notification", "CREATE", "SELF"))])
async def save_draft(body: ComposeBody) -> MessageResponse:
    return MessageResponse(message="draft accepted")
