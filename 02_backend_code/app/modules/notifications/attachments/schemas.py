"""Notification attachment schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationAttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    notification_id: int | None
    file_reference: str
    file_name: str
    mime_type: str
    file_size: int
    uploaded_by: int | None
    created_at: datetime
