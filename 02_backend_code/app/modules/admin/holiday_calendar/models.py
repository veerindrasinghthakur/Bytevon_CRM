"""HolidayCalendar and Holiday ORM models."""
from __future__ import annotations
from datetime import date
from typing import List, Optional
from sqlalchemy import Boolean, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import ArchiveMixin, Base, ChangedByMixin, CreatedAtMixin, IdentityMixin, TimestampMixin
from app.core.db.enums import HolidayType

class HolidayCalendar(Base, IdentityMixin, ArchiveMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "holiday_calendars"
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    holidays: Mapped[List["Holiday"]] = relationship(
        "Holiday", back_populates="calendar", cascade="all, delete-orphan"
    )

class Holiday(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "holidays"
    holiday_calendar_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("holiday_calendars.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    holiday_type: Mapped[HolidayType] = mapped_column(nullable=False)
    recurring_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    calendar: Mapped["HolidayCalendar"] = relationship("HolidayCalendar", back_populates="holidays")
