"""
Notifications ORM models.

Tables: notification_templates, notifications, notification_preferences

Locked rules:
- Only NotificationPublicService may write these tables.
- Always invoked after successful business commit.
- V1 channels: IN_APP (+ EMAIL optional).
- Recipients: EMPLOYMENT, DEPARTMENT, TEAM.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, CreatedAtMixin, IdentityMixin, TimestampMixin
from app.core.db.enums import (
    NotificationAction,
    NotificationChannel,
    NotificationRecipientType,
    NotificationStatus,
)


class NotificationTemplate(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "notification_templates"
    __table_args__ = (
        UniqueConstraint("code", name="uq_notification_templates_code"),
    )

    code: Mapped[str] = mapped_column(String(100), nullable=False)
    title_template: Mapped[str] = mapped_column(Text, nullable=False)
    body_template: Mapped[str] = mapped_column(Text, nullable=False)
    variables: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Notification(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "notifications"

    recipient_type: Mapped[NotificationRecipientType] = mapped_column(nullable=False)
    recipient_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    template_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("notification_templates.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        nullable=False, default=NotificationChannel.IN_APP
    )
    action: Mapped[NotificationAction] = mapped_column(
        nullable=False, default=NotificationAction.OPEN
    )
    status: Mapped[NotificationStatus] = mapped_column(
        nullable=False, default=NotificationStatus.UNREAD
    )
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    template: Mapped[NotificationTemplate | None] = relationship(
        "NotificationTemplate"
    )


class NotificationAttachment(Base, IdentityMixin, CreatedAtMixin):
    """Real file attachment for a notification (Minio object + metadata).

    Uploaded before send (notification_id NULL); linked when the compose
    fan-out persists the notification rows.
    """

    __tablename__ = "notification_attachments"

    notification_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("notifications.id"), nullable=True, index=True
    )
    file_reference: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    uploaded_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class NotificationDraft(Base, IdentityMixin, TimestampMixin):
    """Saved compose draft owned by one employment (mirrors compose payload)."""

    __tablename__ = "notification_drafts"

    owner_employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(Text, nullable=False, default="")
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="Normal")
    module_ctx: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    broadcast_all: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    roles: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[]")
    employment_ids: Mapped[list] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )
    channels: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )
    template_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    schedule_mode: Mapped[str] = mapped_column(
        String(20), nullable=False, default="now"
    )
    schedule_at: Mapped[str | None] = mapped_column(String(50), nullable=True)


class NotificationSetting(Base):
    """Global notification settings KV (channels, triggers, batch, quiet)."""

    __tablename__ = "notification_settings"

    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    value: Mapped[dict[str, Any] | list] = mapped_column(JSONB, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class NotificationPreference(Base):
    """PK = (employment_id, channel)."""

    __tablename__ = "notification_preferences"
    __table_args__ = (
        UniqueConstraint(
            "employment_id",
            "channel",
            name="uq_notification_preferences_employment_channel",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    channel: Mapped[NotificationChannel] = mapped_column(nullable=False)
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
