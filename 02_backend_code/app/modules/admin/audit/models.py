"""Audit ORM model (admin domain)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base, IdentityMixin
from app.core.db.enums import AuditAction, AuditReferenceType


class AuditLog(Base, IdentityMixin):
    __tablename__ = "audit_logs"

    reference_type: Mapped[AuditReferenceType] = mapped_column(nullable=False, index=True)
    reference_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    action: Mapped[AuditAction] = mapped_column(nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    employment_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
