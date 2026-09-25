"""Notification attachment routes."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.notifications.attachments.schemas import (
    NotificationAttachmentResponse,
)
from app.modules.notifications.attachments.service import AttachmentService

router = APIRouter(prefix="/notifications", tags=["Notifications — Attachments"])


def _service(session=Depends(get_db_session)) -> AttachmentService:
    return AttachmentService(session)


@router.post("/attachments", response_model=NotificationAttachmentResponse)
async def upload_attachment(
    file: Annotated[UploadFile, File(...)],
    service: Annotated[AttachmentService, Depends(_service)],
    auth: Annotated[AuthContext, Depends(require_permission("notification", "CREATE", "SELF"))],
) -> NotificationAttachmentResponse:
    return await service.upload(file, actor_employment_id=auth.employment_id)


@router.get("/attachments/pending")
async def pending_attachments(
    service: Annotated[AttachmentService, Depends(_service)],
    auth: Annotated[AuthContext, Depends(require_permission("notification", "CREATE", "SELF"))],
) -> list[dict[str, Any]]:
    return await service.pending_for_uploader(auth.employment_id)


@router.get("/{notification_id}/attachments", response_model=list[NotificationAttachmentResponse])
async def notification_attachments(
    notification_id: int,
    service: Annotated[AttachmentService, Depends(_service)],
    auth: Annotated[AuthContext, Depends(require_permission("notification", "VIEW", "SELF"))],
) -> list[NotificationAttachmentResponse]:
    return await service.list_for_notification(notification_id)
