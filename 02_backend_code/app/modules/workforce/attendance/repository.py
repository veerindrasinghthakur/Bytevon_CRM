"""Attendance repository — re-exports shared AttendanceRepository.

Models remain in app.modules.attendance.models until the attendance package
is fully retired (self-service moves to my-work).
"""
from __future__ import annotations

from app.modules.attendance.repositories.repository import AttendanceRepository

__all__ = ["AttendanceRepository"]
