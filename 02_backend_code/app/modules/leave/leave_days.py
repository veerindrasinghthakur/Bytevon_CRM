"""Canonical leave-day calculation (Q13).

Single source of truth for converting a date range into leave days:
working days (Mon-Fri) minus holidays. Used by submit validation, HOLD
amounts, approval CONSUMPTION, preview/calculate, and balance checks so all
paths agree. Calendar-day counting is intentionally NOT used anywhere.
"""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal


def working_days(
    start: date,
    end: date,
    *,
    holiday_dates: set[date],
    half_day: bool = False,
) -> Decimal:
    if end < start:
        return Decimal("0")
    days = 0
    cur = start
    while cur <= end:
        if cur.weekday() < 5 and cur not in holiday_dates:
            days += 1
        cur += timedelta(days=1)
    if half_day and days >= 1:
        return max(Decimal("0.5"), Decimal(days) - Decimal("0.5"))
    return Decimal(days)


async def load_holiday_dates(session, *, year: int | None = None) -> set[date]:
    """Union of holiday dates across all active calendars (function-level
    import to avoid a module cycle with admin.holiday_calendar)."""
    from app.modules.admin.holiday_calendar.service import HolidayCalendarService

    org = HolidayCalendarService(session)
    out: set[date] = set()
    for cal in await org.list(include_archived=False):
        for h in await org.list_holidays(cal.id):
            if year is not None and h.date.year != year:
                continue
            out.add(h.date)
    return out


async def canonical_leave_days(
    session,
    start: date,
    end: date,
) -> Decimal:
    """Canonical day cost for submit/validation/hold/ledger paths."""
    holidays = await load_holiday_dates(session)
    in_range = {d for d in holidays if start <= d <= end}
    return working_days(start, end, holiday_dates=in_range)
