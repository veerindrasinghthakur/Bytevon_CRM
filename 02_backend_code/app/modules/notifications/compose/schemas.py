"""Compose / notify schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import (
    NotificationAction,
    NotificationChannel,
    NotificationRecipientType,
    NotificationStatus,
)


class MessageResponse(BaseModel):
    message: str = "ok"
    queued: int = 0


class ComposeBody(BaseModel):
    title: str = ""
    body: str = ""
    employment_ids: list[int] = Field(default_factory=list)
    broadcastAll: bool = False
    template_code: str | None = None
    channels: dict[str, bool] = Field(default_factory=dict)


class NotifyRequest(BaseModel):
    recipient_type: NotificationRecipientType
    recipient_id: int
    template_code: str | None = None
    title: str | None = None
    body: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    channel: NotificationChannel = NotificationChannel.IN_APP
    action: NotificationAction = NotificationAction.OPEN
    expires_at: datetime | None = None


class NotifyBulkRequest(BaseModel):
    employment_ids: list[int]
    template_code: str | None = None
    title: str | None = None
    body: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    channel: NotificationChannel = NotificationChannel.IN_APP
    action: NotificationAction = NotificationAction.OPEN
    expires_at: datetime | None = None


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
