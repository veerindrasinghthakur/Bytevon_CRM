"""Admin / RBAC / workforce seed — users, roles, audit, departments, offices, auth_users."""
from __future__ import annotations

from datetime import datetime, timedelta


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def build_seed() -> dict:
    now = datetime(2026, 8, 24, 12, 0, 0)
    roles = [
        {
            "id": "R-01",
            "name": "Senior Administrator",
            "description": "Full Access",
            "usersCount": 1,
            "permissions": ["users.manage", "roles.manage", "settings.write", "audit.read"],
            "status": "Active",
            "category": "Core Role",
            "coveragePct": 100,
            "coverageLabel": "Full Access",
            "created": "Jan 01, 2025",
            "updated": "2h ago",
        },
        {
            "id": "R-02",
            "name": "HR Manager",
            "description": "HR ops",
            "usersCount": 1,
            "permissions": ["employees.read", "leave.manage", "attendance.manage"],
            "status": "Active",
            "category": "Operational",
            "coveragePct": 55,
            "coverageLabel": "10/18 Modules",
            "created": "Jan 01, 2025",
            "updated": "1d ago",
        },
        {
            "id": "R-03",
            "name": "Employee",
            "description": "Standard",
            "usersCount": 1,
            "permissions": ["my-work.read", "requests.submit"],
            "status": "Active",
            "category": "Standard",
            "coveragePct": 15,
            "coverageLabel": "3/18 Modules",
            "created": "Jan 01, 2025",
            "updated": "1d ago",
        },
    ]
    persons = [
        {"id": 1, "first_name": "Admin", "last_name": "User", "email": "admin@bytevon.local", "phone": "+1-555-0001"},
        {"id": 2, "first_name": "HR", "last_name": "User", "email": "hr@bytevon.local", "phone": "+1-555-0002"},
    ]
    employments = [
        {"id": 1, "person_id": 1, "employee_code": "EMP-1001", "joining_date": "2024-01-01", "status": "ACTIVE"},
        {"id": 2, "person_id": 2, "employee_code": "EMP-1002", "joining_date": "2024-02-01", "status": "ACTIVE"},
    ]
    departments = [
        {"id": 1, "name": "Engineering", "code": "ENG", "status": "ACTIVE"},
        {"id": 2, "name": "People", "code": "PEO", "status": "ACTIVE"},
    ]
    login_users = [
        {
            "id": 1, "employment_id": 1, "email": "admin@bytevon.local", "temporary_password": "ChangeMeAdmin!123",
            "status": "ACTIVE", "failed_attempt_count": 0, "locked_until": None,
            "last_login_at": _iso(now - timedelta(hours=1)), "created_at": _iso(now), "updated_at": _iso(now),
        },
        {
            "id": 2, "employment_id": 2, "email": "hr@bytevon.local", "temporary_password": "HrDemo!123",
            "status": "ACTIVE", "failed_attempt_count": 0, "locked_until": None,
            "last_login_at": _iso(now - timedelta(hours=2)), "created_at": _iso(now), "updated_at": _iso(now),
        },
    ]
    admin_users = [
        {
            "id": 1, "employmentId": 1, "name": "Admin User", "email": "admin@bytevon.local",
            "role": "Senior Administrator", "department": "Engineering", "status": "Active",
            "lastLogin": "just now", "lastLoginAt": login_users[0]["last_login_at"],
            "initials": "AU", "employeeCode": "EMP-1001",
        },
        {
            "id": 2, "employmentId": 2, "name": "HR User", "email": "hr@bytevon.local",
            "role": "HR Manager", "department": "People", "status": "Active",
            "lastLogin": "2h ago", "lastLoginAt": login_users[1]["last_login_at"],
            "initials": "HU", "employeeCode": "EMP-1002",
        },
    ]
    auth_users = [
        {"email": "admin@bytevon.local", "password": "ChangeMeAdmin!123", "login_id": 1, "name": "Admin User", "employment_id": 1, "roles": ["Senior Administrator"]},
        {"email": "hr@bytevon.local", "password": "HrDemo!123", "login_id": 2, "name": "HR User", "employment_id": 2, "roles": ["HR Manager"]},
    ]
    return {
        "meta": {"generated_at": _iso(now), "note": "TEMPORARY demo store — delete when real backend is wired"},
        "auth_users": auth_users,
        "roles": roles,
        "admin_users": admin_users,
        "login_users": login_users,
        "persons": persons,
        "employments": employments,
        "employment_assignments": [
            {"id": 1, "employment_id": 1, "department_id": 1, "position_id": 1, "effective_from": "2024-01-01", "effective_to": None},
            {"id": 2, "employment_id": 2, "department_id": 2, "position_id": 3, "effective_from": "2024-02-01", "effective_to": None},
        ],
        "employee_roles": [
            {"employment_id": 1, "role_id": "R-01", "role_id_num": 1, "assigned_at": _iso(now), "changed_by": 1},
            {"employment_id": 2, "role_id": "R-02", "role_id_num": 2, "assigned_at": _iso(now), "changed_by": 1},
        ],
        "departments": departments,
        "positions": [
            {"id": 1, "name": "Software Engineer", "status": "ACTIVE"},
            {"id": 3, "name": "HR Specialist", "status": "ACTIVE"},
        ],
        "audit_logs": [],
        "security_events": [],
        "resources": [{"id": 1, "name": "users", "description": "users module"}],
        "permissions": [{"id": 1, "resource_id": 1, "resource_name": "users", "action": "VIEW"}],
        "organization_profile": {
            "name": "Bytevon Global Holdings",
            "legal": "Bytevon Global Holdings Inc.",
            "email": "admin@bytevon.com",
            "phone": "+1 (555) 012-3456",
            "website": "https://bytevon.com",
            "tax": "TX-9928341",
            "reg": "BRN-001293",
            "description": "Leading enterprise solutions provider for global workforce management.",
        },
        "attendance_settings": {
            "shiftStart": "09:00", "shiftEnd": "18:00", "graceMinutes": 15,
            "earlyOutMinutes": 30, "otMinMinutes": 60, "allowRemoteCheckIn": True,
        },
        "leave_accrual_policy": {"maxCarryOverDays": 10, "minimumNoticeDays": 7},
        "offices": [
            {"id": "blr", "name": "Bangalore Hub", "country": "India", "city": "Bengaluru",
             "timezone": "UTC+05:30 IST", "currency": "INR", "fiscal": "Apr - Mar",
             "address": "Manyata Tech Park", "postal": "560045"},
        ],
        "sessions": [],
        "metrics": {"users": 2, "roles": 3, "activeSessions": 1, "auditEventsToday": 0, "configHealth": "Good",
                    "offices": 1, "departments": 2, "employees": 2},
        "counters": {"next_role": 4, "next_audit": 1, "next_login": 3},
    }
