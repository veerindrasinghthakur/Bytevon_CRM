"""Shim — re-export domain schemas for legacy imports."""
from app.modules.notifications.center.schemas import NotificationResponse
from app.modules.notifications.compose.schemas import NotifyBulkRequest, NotifyRequest
from app.modules.notifications.preference.schemas import (
    PreferenceResponse,
    PreferenceUpdate,
)
from app.modules.notifications.template.schemas import (
    MessageResponse,
    NotificationTemplateCreate,
    NotificationTemplateResponse,
    NotificationTemplateUpdate,
)

__all__ = [
    "MessageResponse",
    "NotificationTemplateCreate",
    "NotificationTemplateUpdate",
    "NotificationTemplateResponse",
    "NotifyRequest",
    "NotifyBulkRequest",
    "NotificationResponse",
    "PreferenceUpdate",
    "PreferenceResponse",
]
