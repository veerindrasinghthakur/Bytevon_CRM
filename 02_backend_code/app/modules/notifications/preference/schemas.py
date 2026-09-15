"""Preference schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.core.db.enums import NotificationChannel


class PreferenceUpdate(BaseModel):
    channel: NotificationChannel
    is_enabled: bool


class PreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    channel: NotificationChannel
    is_enabled: bool
    updated_at: datetime
