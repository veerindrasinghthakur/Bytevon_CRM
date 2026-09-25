"""Notification draft schemas (mirror the compose payload)."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class NotificationDraftCreate(BaseModel):
    title: str = ""
    body: str = ""
    priority: str = "Normal"
    module_ctx: str = ""
    broadcast_all: bool = False
    roles: list[str] = []
    employment_ids: list[int] = []
    channels: dict[str, Any] = {}
    template_code: str | None = None
    schedule_mode: str = "now"
    schedule_at: str | None = None


class NotificationDraftUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    priority: str | None = None
    module_ctx: str | None = None
    broadcast_all: bool | None = None
    roles: list[str] | None = None
    employment_ids: list[int] | None = None
    channels: dict[str, Any] | None = None
    template_code: str | None = None
    schedule_mode: str | None = None
    schedule_at: str | None = None


class NotificationDraftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str
    priority: str
    module_ctx: str
    broadcast_all: bool
    roles: list[str]
    employment_ids: list[int]
    channels: dict[str, Any]
    template_code: str | None
    schedule_mode: str
    schedule_at: str | None
    created_at: datetime
    updated_at: datetime
