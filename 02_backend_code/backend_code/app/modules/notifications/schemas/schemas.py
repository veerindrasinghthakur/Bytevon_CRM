"""
Pydantic v2 schemas for Notifications module.
"""

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
    message: str


# ===========================================================================
# Templates
# ===========================================================================

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


# ===========================================================================
# Notify (public API for other modules — after commit)
# ===========================================================================

class NotifyRequest(BaseModel):
    """Called by other Public Services after their successful commit."""

    recipient_type: NotificationRecipientType
    recipient_id: int
    template_code: Optional[str] = None
    title: Optional[str] = None  # used when no template
    body: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    channel: NotificationChannel = NotificationChannel.IN_APP
    action: NotificationAction = NotificationAction.OPEN
    expires_at: Optional[datetime] = None


class NotifyBulkRequest(BaseModel):
    """Notify multiple employment IDs (e.g. expanded from department/team)."""

    employment_ids: List[int]
    template_code: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    channel: NotificationChannel = NotificationChannel.IN_APP
    action: NotificationAction = NotificationAction.OPEN
    expires_at: Optional[datetime] = None


# ===========================================================================
# Notification responses / user actions
# ===========================================================================

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


# ===========================================================================
# Preferences
# ===========================================================================

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
