"""
Organization ORM models.

Tables:
  departments, working_weeks, shifts, holiday_calendars, holidays,
  locations, organization_settings

Schema source: Complete_Final_Schema.md §1 Organization.
FK references to employments use Integer only (Employment module not yet loaded).
"""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal
from typing import List, Optional

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
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import (
    ArchiveMixin,
    Base,
    ChangedByMixin,
    CreatedAtMixin,
    EffectiveDatingMixin,
    IdentityMixin,
    TimestampMixin,
)
from app.core.db.enums import HolidayType


# ---------------------------------------------------------------------------
# departments 🟨 (archive)
# ---------------------------------------------------------------------------

class Department(Base, IdentityMixin, ArchiveMixin, CreatedAtMixin):
    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    department_head_employment_id: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="FK employments.id (soft reference)"
    )
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="Employment ID or SYSTEM_EMPLOYMENT_ID"
    )


# ---------------------------------------------------------------------------
# working_weeks 🟦 (versioned)
# ---------------------------------------------------------------------------

class WorkingWeek(Base, IdentityMixin, EffectiveDatingMixin, CreatedAtMixin):
    __tablename__ = "working_weeks"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    # PostgreSQL SMALLINT[] — days of week (0=Mon … 6=Sun or 1–7; document convention)
    working_days_of_week: Mapped[List[int]] = mapped_column(
        ARRAY(SmallInteger), nullable=False
    )
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


# ---------------------------------------------------------------------------
# shifts 🟨
# ---------------------------------------------------------------------------

class Shift(Base, IdentityMixin, ArchiveMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "shifts"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_overnight: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    grace_late_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    flexible_end: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    break_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


# ---------------------------------------------------------------------------
# holiday_calendars 🟨
# ---------------------------------------------------------------------------

class HolidayCalendar(Base, IdentityMixin, ArchiveMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "holiday_calendars"

    name: Mapped[str] = mapped_column(String(150), nullable=False)

    holidays: Mapped[List["Holiday"]] = relationship(
        "Holiday", back_populates="calendar", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# holidays 🟩 (append-only)
# ---------------------------------------------------------------------------

class Holiday(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "holidays"

    holiday_calendar_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("holiday_calendars.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    holiday_type: Mapped[HolidayType] = mapped_column(nullable=False)
    recurring_flag: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    calendar: Mapped["HolidayCalendar"] = relationship(
        "HolidayCalendar", back_populates="holidays"
    )


# ---------------------------------------------------------------------------
# locations 🟨
# ---------------------------------------------------------------------------

class Location(Base, IdentityMixin, ArchiveMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "locations"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    timezone: Mapped[str] = mapped_column(String(100), nullable=False)
    working_week_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("working_weeks.id"), nullable=True
    )
    holiday_calendar_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("holiday_calendars.id"), nullable=True
    )
    latitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    attendance_radius_meters: Mapped[int] = mapped_column(Integer, nullable=False)
    allowed_ip_cidrs: Mapped[List[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    payroll_region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    currency: Mapped[str] = mapped_column(String(20), nullable=False)
    fiscal_year_start_month: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    working_week: Mapped[Optional["WorkingWeek"]] = relationship("WorkingWeek")
    holiday_calendar: Mapped[Optional["HolidayCalendar"]] = relationship(
        "HolidayCalendar"
    )


# ---------------------------------------------------------------------------
# organization_settings 🟨 (singleton)
# ---------------------------------------------------------------------------

class OrganizationSettings(Base, IdentityMixin, TimestampMixin, ChangedByMixin):
    """Exactly one row. Represents the organization."""

    __tablename__ = "organization_settings"

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    head_office_location_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("locations.id"), nullable=True
    )
    default_timezone: Mapped[str] = mapped_column(String(100), nullable=False)
    default_currency: Mapped[str] = mapped_column(String(20), nullable=False)
    logo_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    head_office: Mapped[Optional["Location"]] = relationship("Location")
