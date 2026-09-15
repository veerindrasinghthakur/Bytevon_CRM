"""AttendanceService — operational attendance (workforce).

Delegates to the existing AttendancePublicService implementation so behavior
stays identical while HTTP moves under /workforce/attendance.
Policy CRUD remains on the attendance module (admin policy UI) until moved
to admin settings.
"""
from __future__ import annotations

from app.modules.attendance.services.public_service import AttendancePublicService

# Operational service alias used by workforce routes
AttendanceService = AttendancePublicService

__all__ = ["AttendanceService", "AttendancePublicService"]
