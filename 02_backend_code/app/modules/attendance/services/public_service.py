"""Shim — AttendancePublicService is workforce.attendance.AttendanceService."""
from app.modules.workforce.attendance.service import (
    AttendancePublicService,
    AttendanceService,
)

__all__ = ["AttendancePublicService", "AttendanceService"]
