"""Template schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class NotificationTemplateCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=100)
    title_template: str = Field(..., min_length=1)
    body_template: str = Field(..., min_length=1)
    variables: Optional[Dict[str, Any]] = None
    is_active: bool = True


class NotificationTemplateUpdate(BaseModel):
    title_template: Optional[str] = None
    body_template: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class NotificationTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    title_template: str
    body_template: str
    variables: Optional[Dict[str, Any]]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]
