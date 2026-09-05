"""
Approvals ORM models.

Tables: approval_requests, approval_actions

Locked rules:
- This module writes ONLY these two tables.
- Consumers own local status projection.
- approval_actions is append-only.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, CreatedAtMixin, IdentityMixin, TimestampMixin
from app.core.db.enums import ApprovalActionType, ApprovalStatus, ApprovalTarget


class ApprovalRequest(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "approval_requests"

    request_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Polymorphic type e.g. LEAVE_REQUEST, ATTENDANCE_CORRECTION",
    )
    reference_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
        comment="ID of the consumer entity",
    )
    requester_employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    target: Mapped[ApprovalTarget] = mapped_column(nullable=False)
    target_department_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("departments.id"), nullable=True, index=True
    )
    status: Mapped[ApprovalStatus] = mapped_column(
        nullable=False, default=ApprovalStatus.PENDING
    )

    actions: Mapped[List["ApprovalAction"]] = relationship(
        "ApprovalAction",
        back_populates="approval_request",
        order_by="ApprovalAction.created_at",
        cascade="all, delete-orphan",
    )


class ApprovalAction(Base, IdentityMixin, CreatedAtMixin):
    """Append-only action log. Never updated or deleted."""

    __tablename__ = "approval_actions"

    approval_request_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("approval_requests.id"), nullable=False, index=True
    )
    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    action: Mapped[ApprovalActionType] = mapped_column(nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    approval_request: Mapped["ApprovalRequest"] = relationship(
        "ApprovalRequest", back_populates="actions"
    )
