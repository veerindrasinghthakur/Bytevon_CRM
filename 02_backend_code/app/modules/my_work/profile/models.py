"""Profile-owned models: user preferences."""
from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base, IdentityMixin, TimestampMixin


class UserPreference(Base, IdentityMixin, TimestampMixin):
    """Per-login UI + profile settings. Notification channel toggles live in
    notification_preferences (keyed by employment); this holds the rest."""

    __tablename__ = "user_preferences"

    login_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("logins.id"), nullable=False, unique=True, index=True
    )
    language: Mapped[str] = mapped_column(String(10), nullable=False, server_default="en")
    theme: Mapped[str] = mapped_column(String(20), nullable=False, server_default="system")
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_object: Mapped[str | None] = mapped_column(Text, nullable=True)
