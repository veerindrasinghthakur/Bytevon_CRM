"""
Leave ORM models.

Tables: leave_policies, leave_requests, leave_ledger

Locked rules:
- leave_ledger is append-only; balance = SUM(days).
- leave_policies are versioned (effective_from / effective_to).
- Consumer of Approvals: owns local status projection on leave_requests.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import (
    Base,
    CreatedAtMixin,
    EffectiveDatingMixin,
    IdentityMixin,
    TimestampMixin,
)
from app.core.db.enums import LeaveRequestStatus, LeaveType


class LeavePolicy(Base, IdentityMixin, EffectiveDatingMixin, CreatedAtMixin):
    """Versioned leave policy. Never overwrite; close previous + insert new."""

    __tablename__ = "leave_policies"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    leave_type: Mapped[LeaveType] = mapped_column(nullable=False, index=True)
    annual_entitlement: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    carry_forward_limit: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class LeaveRequest(Base, IdentityMixin, TimestampMixin):
    """
    Employee leave request. status is the local projection owned by Leave module.
    approval_request_id links to the Approvals engine.
    """

    __tablename__ = "leave_requests"

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    leave_type: Mapped[LeaveType] = mapped_column(nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approval_request_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("approval_requests.id"), nullable=True, index=True
    )
    status: Mapped[LeaveRequestStatus] = mapped_column(
        nullable=False, default=LeaveRequestStatus.PENDING
    )
    days: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(6, 2),
        nullable=True,
        comment="Cached duration in days; derived at submit time",
    )


class LeaveLedger(Base, IdentityMixin, CreatedAtMixin):
    """Append-only leave balance ledger. Current balance = SUM(days)."""

    __tablename__ = "leave_ledger"

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    leave_type: Mapped[LeaveType] = mapped_column(nullable=False, index=True)
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    days: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False,
        comment="Positive = credit, negative = debit",
    )
    reference_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reference_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
