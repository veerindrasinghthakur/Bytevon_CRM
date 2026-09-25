"""Notification attachment upload (Minio) + linking."""
from __future__ import annotations

import logging
from io import BytesIO
from typing import Any
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import DomainError
from app.core.services.base_public_service import BasePublicService
from app.modules.notifications.attachments.schemas import (
    NotificationAttachmentResponse,
)
from app.modules.notifications.models import NotificationAttachment

logger = logging.getLogger(__name__)

ATTACHMENT_BUCKET = "notification-attachments"
ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
ATTACHMENT_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class AttachmentService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def upload(
        self, file: UploadFile, *, actor_employment_id: int | None = None
    ) -> NotificationAttachmentResponse:
        content_type = (file.content_type or "").lower()
        if content_type not in ATTACHMENT_CONTENT_TYPES:
            raise DomainError("Attachment must be PDF, image, or Word document")
        blob = await file.read()
        if not blob:
            raise DomainError("Empty file")
        if len(blob) > ATTACHMENT_MAX_BYTES:
            raise DomainError("Attachment must be under 10 MB")
        ext = (file.filename or "file").rsplit(".", 1)[-1].lower()[:10] or "bin"
        obj = f"{uuid4().hex}.{ext}"
        try:
            from minio.error import MinioException

            from app.core.storage.minio import get_minio_client

            client = get_minio_client()
            try:
                if not client.bucket_exists(ATTACHMENT_BUCKET):
                    client.make_bucket(ATTACHMENT_BUCKET)
            except MinioException:
                logger.exception("Attachment bucket check failed")
            client.put_object(
                bucket_name=ATTACHMENT_BUCKET,
                object_name=obj,
                data=BytesIO(blob),
                length=len(blob),
                content_type=content_type,
            )
        except Exception as exc:
            logger.exception("Attachment upload failed")
            raise DomainError("Attachment upload failed") from exc
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        row = NotificationAttachment(
            notification_id=None,
            file_reference=f"{ATTACHMENT_BUCKET}/{obj}",
            file_name=file.filename or obj,
            mime_type=content_type,
            file_size=len(blob),
            uploaded_by=actor,
        )
        self._session.add(row)
        await self._commit()
        await self._session.refresh(row)
        await self._audit("notification.attachment_uploaded", row.id, actor)
        return NotificationAttachmentResponse.model_validate(row)

    async def link_to_notifications(
        self, attachment_ids: list[int], notification_ids: list[int]
    ) -> int:
        """Clone unlinked uploads onto each sent notification (snapshot)."""
        if not attachment_ids or not notification_ids:
            return 0
        rows = (
            await self._session.execute(
                select(NotificationAttachment).where(
                    NotificationAttachment.id.in_(attachment_ids),
                    NotificationAttachment.notification_id.is_(None),
                )
            )
        ).scalars().all()
        n = 0
        for src in rows:
            for nid in notification_ids:
                self._session.add(
                    NotificationAttachment(
                        notification_id=int(nid),
                        file_reference=src.file_reference,
                        file_name=src.file_name,
                        mime_type=src.mime_type,
                        file_size=src.file_size,
                        uploaded_by=src.uploaded_by,
                    )
                )
                n += 1
        await self._commit()
        return n

    async def list_for_notification(
        self, notification_id: int,
    ) -> list[NotificationAttachmentResponse]:
        rows = (
            await self._session.execute(
                select(NotificationAttachment).where(
                    NotificationAttachment.notification_id == notification_id
                )
            )
        ).scalars().all()
        return [NotificationAttachmentResponse.model_validate(r) for r in rows]

    async def pending_for_uploader(
        self, actor_employment_id: int,
    ) -> list[dict[str, Any]]:
        rows = (
            await self._session.execute(
                select(NotificationAttachment).where(
                    NotificationAttachment.notification_id.is_(None),
                    NotificationAttachment.uploaded_by == actor_employment_id,
                )
            )
        ).scalars().all()
        return [NotificationAttachmentResponse.model_validate(r).model_dump() for r in rows]
