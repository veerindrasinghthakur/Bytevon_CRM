"""
Organization package is deprecated (2026-09-14).

Prefer app.modules.admin.* domain packages.
This package remains as a thin compatibility shim for models + public service
so leave/seeds/cross-module callers keep working during migration.
"""
from __future__ import annotations

from app.modules.admin.department.models import Department
from app.modules.admin.holiday_calendar.models import Holiday, HolidayCalendar
from app.modules.admin.location.models import Location
from app.modules.admin.settings.models import OrganizationSettings
from app.modules.admin.shift.models import Shift
from app.modules.admin.working_week.models import WorkingWeek

__all__ = [
    "Department",
    "Holiday",
    "HolidayCalendar",
    "Location",
    "OrganizationSettings",
    "Shift",
    "WorkingWeek",
]
