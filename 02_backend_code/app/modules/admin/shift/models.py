"""Shift ORM model."""
from __future__ import annotations
from datetime import time
from typing import Optional
from sqlalchemy import Boolean, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column
from app.core.base import ArchiveMixin, Base, ChangedByMixin, IdentityMixin, TimestampMixin

class Shift(Base, IdentityMixin, ArchiveMixin, TimestampMixin, ChangedByMixin):
    __tablename__ = "shifts"
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_overnight: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    grace_late_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    flexible_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    break_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
