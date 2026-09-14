"""Compatibility re-exports — prefer app.modules.admin.<domain>.models."""
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
