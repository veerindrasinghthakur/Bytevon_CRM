"""Template schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class NotificationTemplateCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=100)
    title_template: str = Field(..., min_length=1)
    body_template: str = Field(..., min_length=1)
    variables: dict[str, Any] | None = None
    is_active: bool = True


class NotificationTemplateUpdate(BaseModel):
    title_template: str | None = None
    body_template: str | None = None
    variables: dict[str, Any] | None = None
    is_active: bool | None = None


class NotificationTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    title_template: str
    body_template: str
    variables: dict[str, Any] | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    changed_by: int | None
