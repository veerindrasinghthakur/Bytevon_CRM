"""
Attendance ORM models (owned by workforce).

Tables:
  attendance_days, attendance_punches, attendance_corrections,
  monthly_attendance_summaries, attendance_policies, attendance_breaks
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
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import (
    Base,
    CreatedAtMixin,
    EffectiveDatingMixin,
    IdentityMixin,
    TimestampMixin,
)
from app.core.db.enums import (
    AttendanceCorrectionStatus,
    AttendanceStatus,
    PunchType,
)


class AttendanceDay(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "attendance_days"
    __table_args__ = (
        UniqueConstraint(
            "employment_id",
            "attendance_date",
            name="uq_attendance_days_employment_date",
        ),
    )

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    shift_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("shifts.id"), nullable=True
    )
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[AttendanceStatus] = mapped_column(nullable=False)
    working_hours: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    punches: Mapped[list[AttendancePunch]] = relationship(
        "AttendancePunch",
        back_populates="attendance_day",
        order_by="AttendancePunch.punch_time",
        cascade="all, delete-orphan",
    )
    breaks: Mapped[list[AttendanceBreak]] = relationship(
        "AttendanceBreak",
        back_populates="attendance_day",
        order_by="AttendanceBreak.break_start",
        cascade="all, delete-orphan",
    )
    corrections: Mapped[list[AttendanceCorrection]] = relationship(
        "AttendanceCorrection",
        back_populates="attendance_day",
        cascade="all, delete-orphan",
    )


class AttendancePunch(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "attendance_punches"

    attendance_day_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("attendance_days.id"), nullable=False, index=True
    )
    punch_type: Mapped[PunchType] = mapped_column(nullable=False)
    punch_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    accuracy_meters: Mapped[int | None] = mapped_column(Integer, nullable=True)
    client_ip: Mapped[str] = mapped_column(INET, nullable=False)
    is_valid_punch: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    validation_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    attendance_day: Mapped[AttendanceDay] = relationship(
        "AttendanceDay", back_populates="punches"
    )


class AttendanceCorrection(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "attendance_corrections"

    attendance_day_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("attendance_days.id"), nullable=False, index=True
    )
    requested_check_in: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    requested_check_out: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    approval_request_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("approval_requests.id"), nullable=True, index=True
    )
    status: Mapped[AttendanceCorrectionStatus] = mapped_column(
        nullable=False, default=AttendanceCorrectionStatus.PENDING
    )

    attendance_day: Mapped[AttendanceDay] = relationship(
        "AttendanceDay", back_populates="corrections"
    )


class MonthlyAttendanceSummary(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "monthly_attendance_summaries"
    __table_args__ = (
        UniqueConstraint(
            "employment_id",
            "year",
            "month",
            name="uq_monthly_attendance_summaries_emp_year_month",
        ),
    )

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    month: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    present_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    absent_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    half_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    holiday_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    week_off_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    on_leave_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    working_hours: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False, default=0)
    break_minutes: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    overtime_hours: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    late_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    early_departure_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attendance_percentage: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    rebuilt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_locked: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )


class AttendancePolicy(Base, IdentityMixin, EffectiveDatingMixin, CreatedAtMixin):
    __tablename__ = "attendance_policies"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    correction_window_days: Mapped[int] = mapped_column(Integer, nullable=False)
    max_corrections_per_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reasons_mandatory: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    approval_sla_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    allow_multiple_punches: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    require_checkout_before_new_checkin: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    auto_create_attendance_day: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    default_grace_late_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_clock_drift_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class AttendanceBreak(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "attendance_breaks"

    attendance_day_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("attendance_days.id"), nullable=False, index=True
    )
    break_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    break_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    attendance_day: Mapped[AttendanceDay] = relationship(
        "AttendanceDay", back_populates="breaks"
    )
