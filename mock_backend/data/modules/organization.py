"""Organization seed — locations, shifts, holidays, leave types/policies, working weeks."""
from __future__ import annotations

from datetime import datetime
from typing import Any


def _now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def build_seed() -> dict[str, Any]:
    now = _now_iso()
    return {
        "leave_types": [
            {
                "name": "Annual Leave",
                "desc": "Standard paid vacation",
                "days": "21 Days",
                "eligibility": "All Employees",
                "eligibilityStyle": "bg-secondary/10 text-secondary",
            },
            {
                "name": "Sick Leave",
                "desc": "Medical and health related",
                "days": "10 Days",
                "eligibility": "All Employees",
                "eligibilityStyle": "bg-secondary/10 text-secondary",
            },
            {
                "name": "Maternity Leave",
                "desc": "Parental support leave",
                "days": "90 Days",
                "eligibility": "Female only",
                "eligibilityStyle": "bg-surface-container text-on-surface-variant",
            },
            {
                "name": "Casual Leave",
                "desc": "Unplanned personal matters",
                "days": "5 Days",
                "eligibility": "Full-time",
                "eligibilityStyle": "bg-secondary/10 text-secondary",
            },
        ],
        "leave_policies": [
            {
                "id": 1,
                "name": "Casual 2026",
                "leave_type": "CASUAL",
                "annual_entitlement": 12,
                "carry_forward_limit": 3,
                "effective_from": "2026-01-01",
                "effective_to": None,
            },
            {
                "id": 2,
                "name": "Sick 2026",
                "leave_type": "SICK",
                "annual_entitlement": 10,
                "carry_forward_limit": 0,
                "effective_from": "2026-01-01",
                "effective_to": None,
            },
            {
                "id": 3,
                "name": "Earned 2025",
                "leave_type": "EARNED",
                "annual_entitlement": 15,
                "carry_forward_limit": 5,
                "effective_from": "2025-01-01",
                "effective_to": "2025-12-31",
            },
        ],
        "leave_ledger": [
            {
                "id": 1,
                "leave_type": "CASUAL",
                "transaction_type": "CREDIT",
                "days": 12,
                "reference_type": "POLICY",
                "created_at": "2026-01-01",
            },
            {
                "id": 2,
                "leave_type": "CASUAL",
                "transaction_type": "DEBIT",
                "days": -2,
                "reference_type": "LEAVE_REQUEST",
                "created_at": "2026-03-12",
            },
            {
                "id": 3,
                "leave_type": "SICK",
                "transaction_type": "CREDIT",
                "days": 10,
                "reference_type": "POLICY",
                "created_at": "2026-01-01",
            },
        ],
        "locations": [
            {
                "id": 1,
                "name": "Bengaluru HQ",
                "timezone": "Asia/Kolkata",
                "address": "Manyata Tech Park",
                "postal_code": "560045",
                "is_archived": False,
                "payroll_region": "IN",
                "created_at": now,
                "updated_at": now,
                "changed_by": 1,
            }
        ],
        "shifts": [
            {
                "id": 1,
                "name": "General",
                "start_time": "09:00",
                "end_time": "18:00",
                "is_archived": False,
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": 2,
                "name": "Early",
                "start_time": "07:00",
                "end_time": "16:00",
                "is_archived": False,
                "created_at": now,
                "updated_at": now,
            },
        ],
        "working_weeks": [
            {
                "id": 1,
                "name": "Mon–Fri",
                "monday": True,
                "tuesday": True,
                "wednesday": True,
                "thursday": True,
                "friday": True,
                "saturday": False,
                "sunday": False,
            }
        ],
        "holiday_calendars": [
            {"id": 1, "name": "India National 2026", "is_archived": False, "created_at": now, "updated_at": now}
        ],
        "holidays": [
            {
                "id": 1,
                "holiday_calendar_id": 1,
                "name": "Republic Day",
                "date": "2026-01-26",
                "holiday_type": "NATIONAL",
                "recurring_flag": True,
            },
            {
                "id": 2,
                "holiday_calendar_id": 1,
                "name": "Holi",
                "date": "2026-03-14",
                "holiday_type": "NATIONAL",
                "recurring_flag": False,
            },
            {
                "id": 3,
                "holiday_calendar_id": 1,
                "name": "Independence Day",
                "date": "2026-08-15",
                "holiday_type": "NATIONAL",
                "recurring_flag": True,
            },
            {
                "id": 4,
                "holiday_calendar_id": 1,
                "name": "Gandhi Jayanti",
                "date": "2026-10-02",
                "holiday_type": "NATIONAL",
                "recurring_flag": True,
            },
            {
                "id": 5,
                "holiday_calendar_id": 1,
                "name": "Diwali",
                "date": "2026-10-20",
                "holiday_type": "NATIONAL",
                "recurring_flag": False,
            },
            {
                "id": 6,
                "holiday_calendar_id": 1,
                "name": "Christmas",
                "date": "2026-12-25",
                "holiday_type": "NATIONAL",
                "recurring_flag": True,
            },
        ],
    }
