"""
Leave ORM models.

Tables: leave_types, leave_policies, leave_requests, leave_ledger

Locked rules:
- leave_types is the master catalog (WHAT the leave is). Policies/requests/
  ledger reference it via leave_type_id FK — no enum column.
- leave_ledger is append-only; balance = SUM(days).
- leave_policies are versioned (effective_from / effective_to).
- Consumer of Approvals: owns local status projection on leave_requests.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import (
    Base,
    CreatedAtMixin,
    EffectiveDatingMixin,
    IdentityMixin,
    TimestampMixin,
)
from app.core.db.enums import LeaveRequestStatus


class LeaveType(Base, IdentityMixin, TimestampMixin):
    """Master catalog of leave types (WHAT the leave is).

    Soft-delete only (deleted_at + is_active=False); rows referenced by any
    policy/request/ledger row cannot be deleted. No restore operation.
    """

    __tablename__ = "leave_types"

    code: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_paid: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    requires_approval: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    requires_document: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    allow_half_day: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    allow_hourly: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    is_encashable: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    default_annual_entitlement: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False,
        server_default="0",
        comment="Default days/year used when a policy omits annual_entitlement",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class LeavePolicy(Base, IdentityMixin, EffectiveDatingMixin, CreatedAtMixin):
    """Versioned leave policy. Never overwrite; close previous + insert new."""

    __tablename__ = "leave_policies"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    leave_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("leave_types.id"), nullable=False, index=True
    )
    annual_entitlement: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    carry_forward_limit: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class LeaveRequest(Base, IdentityMixin, TimestampMixin):
    """
    Employee leave request. status is the local projection owned by Leave module.
    approval_request_id links to the Approvals engine.
    """

    __tablename__ = "leave_requests"

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    leave_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("leave_types.id"), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approval_request_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("approval_requests.id"), nullable=True, index=True
    )
    status: Mapped[LeaveRequestStatus] = mapped_column(
        nullable=False, default=LeaveRequestStatus.PENDING
    )
    days: Mapped[Decimal | None] = mapped_column(
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
    leave_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("leave_types.id"), nullable=False, index=True
    )
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    days: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False,
        comment="Positive = credit, negative = debit",
    )
    reference_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
