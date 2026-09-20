"""Aggregate admin ORM models for registry imports."""
from app.modules.admin.holiday_calendar.models import Holiday, HolidayCalendar
from app.modules.admin.location.models import Location
from app.modules.admin.settings.models import OrganizationSettings
from app.modules.admin.shift.models import Shift
from app.modules.admin.working_week.models import WorkingWeek

__all__ = [
    "WorkingWeek", "Shift", "Holiday", "HolidayCalendar",
    "Location", "OrganizationSettings",
]
