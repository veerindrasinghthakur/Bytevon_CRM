"""Aggregate admin ORM models for registry imports."""
from app.modules.admin.department.models import Department
from app.modules.admin.working_week.models import WorkingWeek
from app.modules.admin.shift.models import Shift
from app.modules.admin.holiday_calendar.models import Holiday, HolidayCalendar
from app.modules.admin.location.models import Location
from app.modules.admin.settings.models import OrganizationSettings

__all__ = [
    "Department", "WorkingWeek", "Shift", "Holiday", "HolidayCalendar",
    "Location", "OrganizationSettings",
]
