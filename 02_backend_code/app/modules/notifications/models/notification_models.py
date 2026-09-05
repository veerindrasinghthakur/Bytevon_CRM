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
from typing import Any, Optional

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
    variables: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class Notification(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "notifications"

    recipient_type: Mapped[NotificationRecipientType] = mapped_column(nullable=False)
    recipient_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    template_id: Mapped[Optional[int]] = mapped_column(
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
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    archived_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    template: Mapped[Optional["NotificationTemplate"]] = relationship(
        "NotificationTemplate"
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
