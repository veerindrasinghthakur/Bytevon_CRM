"""Payroll seed — employees, structures, history, period meta, activity, run checks."""
from __future__ import annotations

from typing import Any


def build_seed() -> dict[str, Any]:
    period_meta = {
        "month": "August",
        "year": 2026,
        "monthIndex": 8,
        "label": "August 2026 Payroll",
        "status": "In Progress",
        "calculated": 186,
        "approved": 142,
        "paid": 0,
    }

    payroll_employees = [
        {
            "id": "e1",
            "name": "Sarah Jenkins",
            "code": "BT-092",
            "role": "Senior Engineer",
            "department": "Engineering",
            "initials": "SJ",
            "gross": 8500,
            "earnings": 1200,
            "deductions": 950,
            "net": 8750,
            "status": "Approved",
            "currency": "USD",
            "effectiveFrom": "2024-01-01",
            "salaryStatus": "ACTIVE",
        },
        {
            "id": "e2",
            "name": "Michael Ross",
            "code": "BT-104",
            "role": "Sales Director",
            "department": "Sales",
            "initials": "MR",
            "gross": 6200,
            "earnings": 800,
            "deductions": 700,
            "net": 6300,
            "status": "Calculated",
            "currency": "USD",
            "effectiveFrom": "2024-03-01",
            "salaryStatus": "ACTIVE",
        },
        {
            "id": "e3",
            "name": "Emily Chen",
            "code": "BT-085",
            "role": "HR Manager",
            "department": "HR",
            "initials": "EL",
            "gross": 5800,
            "earnings": 500,
            "deductions": 600,
            "net": 5700,
            "status": "Paid",
            "paymentRef": "TRX-998230",
            "currency": "USD",
            "effectiveFrom": "2023-06-01",
            "salaryStatus": "ACTIVE",
        },
        {
            "id": "e4",
            "name": "Robert Chen",
            "code": "EMP-1042",
            "role": "Senior Engineer",
            "department": "Engineering",
            "initials": "RC",
            "gross": 8500,
            "earnings": 500,
            "deductions": 1250,
            "net": 7750,
            "status": "Calculated",
            "currency": "USD",
            "effectiveFrom": "2024-01-01",
            "salaryStatus": "ACTIVE",
        },
        {
            "id": "e5",
            "name": "David Kim",
            "code": "EMP-0455",
            "role": "Financial Analyst",
            "department": "Finance",
            "initials": "DK",
            "gross": 7500,
            "earnings": 0,
            "deductions": 1100,
            "net": 6400,
            "status": "Paid",
            "paymentRef": "TRX-998232",
            "currency": "USD",
            "effectiveFrom": "2024-02-15",
            "salaryStatus": "ACTIVE",
        },
    ]

    def _structure(eid: str, effective: str, items: list[dict[str, Any]]) -> dict[str, Any]:
        return {
            "employeeId": eid,
            "effectiveFrom": effective,
            "effectiveTo": None,
            "currency": "USD",
            "payFrequency": "Monthly",
            "status": "ACTIVE",
            "items": items,
        }

    salary_structures = {
        "e1": _structure(
            "e1",
            "2024-01-01",
            [
                {"id": "e1-1", "name": "Basic Salary", "type": "EARNING", "amount": 5000},
                {"id": "e1-2", "name": "House Rent Allowance (HRA)", "type": "EARNING", "amount": 2000},
                {"id": "e1-3", "name": "Conveyance Allowance", "type": "EARNING", "amount": 800},
                {"id": "e1-4", "name": "Special Allowance", "type": "EARNING", "amount": 700},
                {"id": "e1-5", "name": "Provident Fund (PF)", "type": "DEDUCTION", "amount": 450},
                {"id": "e1-6", "name": "Professional Tax", "type": "DEDUCTION", "amount": 45},
            ],
        ),
        "e2": _structure(
            "e2",
            "2024-03-01",
            [
                {"id": "e2-1", "name": "Basic Salary", "type": "EARNING", "amount": 4000},
                {"id": "e2-2", "name": "House Rent Allowance (HRA)", "type": "EARNING", "amount": 1500},
                {"id": "e2-3", "name": "Conveyance Allowance", "type": "EARNING", "amount": 400},
                {"id": "e2-4", "name": "Special Allowance", "type": "EARNING", "amount": 300},
                {"id": "e2-5", "name": "Provident Fund (PF)", "type": "DEDUCTION", "amount": 360},
                {"id": "e2-6", "name": "Professional Tax", "type": "DEDUCTION", "amount": 45},
            ],
        ),
        "e3": _structure(
            "e3",
            "2023-06-01",
            [
                {"id": "e3-1", "name": "Basic Salary", "type": "EARNING", "amount": 3500},
                {"id": "e3-2", "name": "House Rent Allowance (HRA)", "type": "EARNING", "amount": 1400},
                {"id": "e3-3", "name": "Conveyance Allowance", "type": "EARNING", "amount": 400},
                {"id": "e3-4", "name": "Special Allowance", "type": "EARNING", "amount": 500},
                {"id": "e3-5", "name": "Provident Fund (PF)", "type": "DEDUCTION", "amount": 315},
                {"id": "e3-6", "name": "Professional Tax", "type": "DEDUCTION", "amount": 45},
            ],
        ),
        "e4": _structure(
            "e4",
            "2024-01-01",
            [
                {"id": "e4-1", "name": "Basic Salary", "type": "EARNING", "amount": 5000},
                {"id": "e4-2", "name": "House Rent Allowance (HRA)", "type": "EARNING", "amount": 2000},
                {"id": "e4-3", "name": "Conveyance Allowance", "type": "EARNING", "amount": 800},
                {"id": "e4-4", "name": "Special Allowance", "type": "EARNING", "amount": 700},
                {"id": "e4-5", "name": "Provident Fund (PF)", "type": "DEDUCTION", "amount": 450},
                {"id": "e4-6", "name": "Professional Tax", "type": "DEDUCTION", "amount": 45},
            ],
        ),
        "e5": _structure(
            "e5",
            "2024-02-15",
            [
                {"id": "e5-1", "name": "Basic Salary", "type": "EARNING", "amount": 4500},
                {"id": "e5-2", "name": "House Rent Allowance (HRA)", "type": "EARNING", "amount": 1800},
                {"id": "e5-3", "name": "Conveyance Allowance", "type": "EARNING", "amount": 600},
                {"id": "e5-4", "name": "Special Allowance", "type": "EARNING", "amount": 600},
                {"id": "e5-5", "name": "Provident Fund (PF)", "type": "DEDUCTION", "amount": 405},
                {"id": "e5-6", "name": "Professional Tax", "type": "DEDUCTION", "amount": 45},
            ],
        ),
    }

    attendance_by_employee = {
        "e1": {
            "workingDays": 22,
            "presentDays": 20,
            "paidLeave": 2,
            "lopDays": 0,
            "workingHours": 176,
            "overtimeHours": 12,
        },
        "e2": {
            "workingDays": 22,
            "presentDays": 21,
            "paidLeave": 1,
            "lopDays": 0,
            "workingHours": 168,
            "overtimeHours": 8,
        },
        "e3": {
            "workingDays": 22,
            "presentDays": 22,
            "paidLeave": 0,
            "lopDays": 0,
            "workingHours": 176,
            "overtimeHours": 4,
        },
        "e4": {
            "workingDays": 22,
            "presentDays": 19,
            "paidLeave": 2,
            "lopDays": 1,
            "workingHours": 152,
            "overtimeHours": 6,
        },
        "e5": {
            "workingDays": 22,
            "presentDays": 20,
            "paidLeave": 2,
            "lopDays": 0,
            "workingHours": 160,
            "overtimeHours": 0,
        },
    }

    adjustments_by_employee = {
        "e1": [
            {
                "id": "adj1",
                "title": "August Attendance Correction",
                "detail": "Manual override for missing punch",
                "amount": 150,
            },
            {
                "id": "adj2",
                "title": "Hardware Deduction",
                "detail": "Lost access badge replacement",
                "amount": -25,
            },
        ],
        "e2": [{"id": "adj3", "title": "Sales incentive", "detail": "Q3 target partial", "amount": 200}],
        "e3": [],
        "e4": [{"id": "adj4", "title": "LOP recovery note", "detail": "One LOP day applied", "amount": -100}],
        "e5": [],
    }

    history_by_employee = {
        "e1": [
            {
                "id": "h1",
                "month": "July 2026",
                "year": 2026,
                "gross": 8500,
                "earnings": 900,
                "deductions": 950,
                "adjustments": 0,
                "net": 8450,
                "paymentDate": "2026-07-31",
                "status": "PAID",
            },
            {
                "id": "h2",
                "month": "June 2026",
                "year": 2026,
                "gross": 8500,
                "earnings": 500,
                "deductions": 950,
                "adjustments": 0,
                "net": 8050,
                "paymentDate": "2026-06-30",
                "status": "PAID",
            },
            {
                "id": "h3",
                "month": "May 2026",
                "year": 2026,
                "gross": 8500,
                "earnings": 500,
                "deductions": 950,
                "adjustments": -100,
                "net": 7950,
                "paymentDate": "2026-05-31",
                "status": "PAID",
            },
        ],
        "e4": [
            {
                "id": "h4",
                "month": "July 2026",
                "year": 2026,
                "gross": 8500,
                "earnings": 400,
                "deductions": 1250,
                "adjustments": 0,
                "net": 7650,
                "paymentDate": "2026-07-31",
                "status": "PAID",
            },
        ],
    }

    recent_activity = [
        {"id": "a1", "text": "Payroll calculated for August 2026", "time": "2h ago", "primary": True},
        {"id": "a2", "text": "Tax filing configuration updated", "time": "5h ago"},
        {"id": "a3", "text": "Salary structure adjusted for Engineering", "time": "Yesterday"},
    ]

    run_payroll_checks = [
        {
            "ok": True,
            "title": "Employee salary configuration available",
            "detail": "All active employees have a base salary set.",
        },
        {
            "ok": True,
            "title": "Monthly attendance summary available",
            "detail": "Timesheets are available for processing.",
        },
        {
            "ok": True,
            "title": "No existing payroll for this month",
            "detail": "Selected period is clear to generate.",
        },
        {
            "ok": True,
            "title": "Period ready",
            "detail": "You can generate payroll for the selected month.",
        },
    ]

    return {
        "payroll_period_meta": period_meta,
        "payroll_employees": payroll_employees,
        "payroll_salary_structures": salary_structures,
        "payroll_attendance_by_employee": attendance_by_employee,
        "payroll_adjustments_by_employee": adjustments_by_employee,
        "payroll_history_by_employee": history_by_employee,
        "payroll_recent_activity": recent_activity,
        "payroll_run_checks": run_payroll_checks,
    }
