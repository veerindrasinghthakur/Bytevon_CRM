"""Workforce seed — attendance dashboard data + schema-aligned department mirror.

Reuses persons/employments/assignments/departments/positions from admin seed.
Adds attendance collections and normalizes department rows for frontend.
"""
from __future__ import annotations

from typing import Any


def build_seed() -> dict[str, Any]:
    # Attendance dashboard / today / corrections (UI-shaped, independent of employment ids)
    attendance_kpis = [
        {"id": "present", "label": "Present", "value": "142", "icon": "check_circle", "hint": "+4 vs yesterday"},
        {"id": "absent", "label": "Absent", "value": "8", "icon": "cancel", "hint": "2 unplanned"},
        {"id": "late", "label": "Late", "value": "11", "icon": "schedule", "hint": "avg 12m"},
        {"id": "wfh", "label": "Remote", "value": "36", "icon": "home", "hint": "approved"},
    ]
    weekly_attendance = [
        {"day": "Mon", "present": 138, "absent": 12, "late": 9},
        {"day": "Tue", "present": 145, "absent": 7, "late": 6},
        {"day": "Wed", "present": 141, "absent": 9, "late": 11},
        {"day": "Thu", "present": 147, "absent": 5, "late": 8},
        {"day": "Fri", "present": 132, "absent": 14, "late": 15},
        {"day": "Sat", "present": 28, "absent": 4, "late": 2},
        {"day": "Sun", "present": 12, "absent": 2, "late": 0},
    ]
    recent_check_ins = [
        {"id": "rc1", "name": "Sarah Chen", "department": "Engineering", "time": "09:02", "status": "ON_TIME"},
        {"id": "rc2", "name": "Marcus Rodriguez", "department": "Sales", "time": "09:18", "status": "LATE"},
        {"id": "rc3", "name": "Elena Wilson", "department": "HR", "time": "08:55", "status": "ON_TIME"},
        {"id": "rc4", "name": "David Sharma", "department": "Finance", "time": "09:41", "status": "LATE"},
        {"id": "rc5", "name": "Priya Patel", "department": "Engineering", "time": "09:00", "status": "ON_TIME"},
    ]
    today_attendance = [
        {
            "id": "att-1",
            "employmentId": "1",
            "name": "Sarah Chen",
            "department": "Engineering",
            "status": "PRESENT",
            "checkIn": "09:02",
            "checkOut": None,
            "workMode": "OFFICE",
            "hours": 0,
        },
        {
            "id": "att-2",
            "employmentId": "2",
            "name": "Marcus Rodriguez",
            "department": "Sales",
            "status": "LATE",
            "checkIn": "09:28",
            "checkOut": None,
            "workMode": "OFFICE",
            "hours": 0,
        },
        {
            "id": "att-3",
            "employmentId": "3",
            "name": "Elena Wilson",
            "department": "HR",
            "status": "PRESENT",
            "checkIn": "08:55",
            "checkOut": "18:10",
            "workMode": "HYBRID",
            "hours": 8.5,
        },
        {
            "id": "att-4",
            "employmentId": "4",
            "name": "David Sharma",
            "department": "Finance",
            "status": "ABSENT",
            "checkIn": None,
            "checkOut": None,
            "workMode": "OFFICE",
            "hours": 0,
        },
        {
            "id": "att-5",
            "employmentId": "5",
            "name": "Priya Patel",
            "department": "Engineering",
            "status": "WFH",
            "checkIn": "09:05",
            "checkOut": None,
            "workMode": "REMOTE",
            "hours": 0,
        },
        {
            "id": "att-6",
            "employmentId": "6",
            "name": "James Kim",
            "department": "Product",
            "status": "PRESENT",
            "checkIn": "08:48",
            "checkOut": None,
            "workMode": "OFFICE",
            "hours": 0,
        },
        {
            "id": "att-7",
            "employmentId": "7",
            "name": "Aisha Nguyen",
            "department": "Marketing",
            "status": "ON_LEAVE",
            "checkIn": None,
            "checkOut": None,
            "workMode": "OFFICE",
            "hours": 0,
        },
        {
            "id": "att-8",
            "employmentId": "8",
            "name": "Chen Singh",
            "department": "Engineering",
            "status": "LATE",
            "checkIn": "10:12",
            "checkOut": None,
            "workMode": "OFFICE",
            "hours": 0,
        },
    ]
    attendance_corrections = [
        {
            "id": "cor-1",
            "employeeName": "Marcus Rodriguez",
            "date": "2026-08-28",
            "reason": "Missed checkout",
            "status": "PENDING",
            "requestedAt": "2026-08-29T10:15:00Z",
        },
        {
            "id": "cor-2",
            "employeeName": "David Sharma",
            "date": "2026-08-27",
            "reason": "Wrong punch time",
            "status": "APPROVED",
            "requestedAt": "2026-08-28T09:00:00Z",
        },
        {
            "id": "cor-3",
            "employeeName": "Priya Patel",
            "date": "2026-08-26",
            "reason": "Client site visit",
            "status": "REJECTED",
            "requestedAt": "2026-08-27T14:22:00Z",
        },
    ]
    attendance_logs = [
        {"id": 1, "time": "09:02:14", "event": "CHECK_IN", "source": "Web", "note": None},
        {"id": 2, "time": "13:05:00", "event": "BREAK_START", "source": "Web", "note": "Lunch"},
        {"id": 3, "time": "13:42:10", "event": "BREAK_END", "source": "Web", "note": None},
        {"id": 4, "time": "18:11:03", "event": "CHECK_OUT", "source": "Web", "note": None},
    ]

    # Day-detail punches keyed lightly; routes generate defaults if missing
    attendance_day_details: dict[str, Any] = {}

    return {
        "workforce_attendance_kpis": attendance_kpis,
        "workforce_weekly_attendance": weekly_attendance,
        "workforce_recent_check_ins": recent_check_ins,
        "workforce_today_attendance": today_attendance,
        "workforce_attendance_corrections": attendance_corrections,
        "workforce_attendance_logs": attendance_logs,
        "workforce_attendance_day_details": attendance_day_details,
        # Empty collections the routes will populate / extend if missing
        "employment_state_history": [],
        "employee_salary": [],
        "employee_bank_accounts": [],
    }
