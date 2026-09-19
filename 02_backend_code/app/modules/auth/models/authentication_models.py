"""
Authentication ORM models.

Tables: persons, logins, sessions, password_reset_tokens

Schema source: Complete_Final_Schema.md + Auth V1 locked decisions
(failed_attempt_count, locked_until, password_reset_tokens).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, CreatedAtMixin, IdentityMixin, TimestampMixin
from app.core.db.enums import DeviceType, SessionRevokeReason, SessionStatus


class Person(Base, IdentityMixin, TimestampMixin):
    """
    Natural person identity (not the employment or login).
    """

    __tablename__ = "persons"

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    personal_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    personal_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_anonymized: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    anonymized_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    login: Mapped[Login | None] = relationship(
        "Login", back_populates="person", uselist=False
    )


class Login(Base, IdentityMixin):
    """
    Authentication credentials for a person.
    One login per person. Email is the only credential and is immutable.
    """

    __tablename__ = "logins"
    __table_args__ = (
        UniqueConstraint("person_id", name="uq_logins_person_id"),
        UniqueConstraint("email", name="uq_logins_email"),
    )

    person_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("persons.id"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    # Auth V1 lockout fields (locked decision; extend schema if not yet present)
    failed_attempt_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    person: Mapped[Person] = relationship("Person", back_populates="login")
    sessions: Mapped[list[Session]] = relationship(
        "Session", back_populates="login", cascade="all, delete-orphan"
    )


class Session(Base, IdentityMixin, CreatedAtMixin):
    """
    Refresh-token session (append-friendly; status transitions).
    Access JWT is never stored.
    """

    __tablename__ = "sessions"

    login_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("logins.id"), nullable=False, index=True
    )
    refresh_token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    device_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    device_type: Mapped[DeviceType] = mapped_column(nullable=False)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[SessionStatus] = mapped_column(
        nullable=False, default=SessionStatus.ACTIVE
    )
    revoked_reason: Mapped[SessionRevokeReason | None] = mapped_column(nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    login: Mapped[Login] = relationship("Login", back_populates="sessions")


class PasswordResetToken(Base, IdentityMixin, CreatedAtMixin):
    """
    Single-use, short-lived password reset tokens (hashed).
    Auth V1 locked feature.
    """

    __tablename__ = "password_reset_tokens"

    login_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("logins.id"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_used: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
