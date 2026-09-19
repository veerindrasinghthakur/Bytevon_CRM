"""Inbox / center schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.core.db.enums import (
    NotificationAction,
    NotificationChannel,
    NotificationRecipientType,
    NotificationStatus,
)


class MessageResponse(BaseModel):
    message: str
    queued: int = 0


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipient_type: NotificationRecipientType
    recipient_id: int
    template_id: int | None
    title: str
    body: str
    payload: dict[str, Any]
    channel: NotificationChannel
    action: NotificationAction
    status: NotificationStatus
    read_at: datetime | None
    archived_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
