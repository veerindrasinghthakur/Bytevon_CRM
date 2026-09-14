"""Location ORM model."""
from __future__ import annotations
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import ForeignKey, Integer, Numeric, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import ArchiveMixin, Base, ChangedByMixin, IdentityMixin, TimestampMixin

class Location(Base, IdentityMixin, ArchiveMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "locations"
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    timezone: Mapped[str] = mapped_column(String(100), nullable=False)
    working_week_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("working_weeks.id"), nullable=True)
    holiday_calendar_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("holiday_calendars.id"), nullable=True)
    latitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    attendance_radius_meters: Mapped[int] = mapped_column(Integer, nullable=False)
    allowed_ip_cidrs: Mapped[List[str]] = mapped_column(ARRAY(Text), nullable=False, server_default="{}")
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    payroll_region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    currency: Mapped[str] = mapped_column(String(20), nullable=False)
    fiscal_year_start_month: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    working_week = relationship("WorkingWeek")
    holiday_calendar = relationship("HolidayCalendar")
