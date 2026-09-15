"""Compose / notify schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

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
    template_code: Optional[str] = None
    channels: dict[str, bool] = Field(default_factory=dict)


class NotifyRequest(BaseModel):
    recipient_type: NotificationRecipientType
    recipient_id: int
    template_code: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    channel: NotificationChannel = NotificationChannel.IN_APP
    action: NotificationAction = NotificationAction.OPEN
    expires_at: Optional[datetime] = None


class NotifyBulkRequest(BaseModel):
    employment_ids: List[int]
    template_code: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    channel: NotificationChannel = NotificationChannel.IN_APP
    action: NotificationAction = NotificationAction.OPEN
    expires_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipient_type: NotificationRecipientType
    recipient_id: int
    template_id: Optional[int]
    title: str
    body: str
    payload: Dict[str, Any]
    channel: NotificationChannel
    action: NotificationAction
    status: NotificationStatus
    read_at: Optional[datetime]
    archived_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
