"""Payroll module mock routes — kpis, employees, review, payslip, salary, run, history."""
from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Body, Query
from store import get_collection, get_obj, set_collection, set_obj

router = APIRouter(tags=["payroll"])
OT_HOURLY_FACTOR = 1.5
STANDARD_MONTH_HOURS = 176

def _paginate(items, page=1, page_size=20):
    page = max(1, int(page or 1))
    page_size = max(1, min(int(page_size or 20), 100))
    total = len(items)
    start = (page - 1) * page_size
    return {"items": items[start:start + page_size], "total": total, "page": page, "pageSize": page_size}

def _employees(): return list(get_collection("payroll_employees"))
def _structures(): return dict(get_obj("payroll_salary_structures") or {})
def _attendance(): return dict(get_obj("payroll_attendance_by_employee") or {})
def _adjustments(): return dict(get_obj("payroll_adjustments_by_employee") or {})
def _history(): return dict(get_obj("payroll_history_by_employee") or {})
def _period():
    return dict(get_obj("payroll_period_meta") or {
        "month": "August", "year": 2026, "monthIndex": 8,
        "label": "August 2026 Payroll", "status": "In Progress",
        "calculated": 0, "approved": 0, "paid": 0,
    })

def _gross(s): return sum(float(i.get("amount") or 0) for i in (s.get("items") or []) if i.get("type") == "EARNING")
def _ded(s): return sum(float(i.get("amount") or 0) for i in (s.get("items") or []) if i.get("type") == "DEDUCTION")
def _ot(gross, hours):
    if hours <= 0: return 0.0
    return round((gross / STANDARD_MONTH_HOURS) * OT_HOURLY_FACTOR * hours)
def _tds(taxable): return 0.0 if taxable <= 0 else round(taxable * 0.1)

def _monthly_summary(rows=None):
    employees = rows if rows is not None else _employees()
    return {
        "totalEmployees": len(employees),
        "grossSalary": sum(float(e.get("gross") or 0) for e in employees),
        "earnings": sum(float(e.get("earnings") or 0) for e in employees),
        "deductions": sum(float(e.get("deductions") or 0) for e in employees),
        "netPayroll": sum(float(e.get("net") or 0) for e in employees),
        "pendingApproval": sum(1 for e in employees if e.get("status") == "Calculated"),
        "pendingPayment": sum(1 for e in employees if e.get("status") == "Approved"),
    }

def _compute_review(employee_id: str):
    employee = next((e for e in _employees() if str(e.get("id")) == str(employee_id)), None)
    if not employee: return None
    structure = _structures().get(employee_id)
    attendance = _attendance().get(employee_id) or {
        "workingDays": 22, "presentDays": 22, "paidLeave": 0, "lopDays": 0,
        "workingHours": 176, "overtimeHours": 0,
    }
    adjustments = list(_adjustments().get(employee_id) or [])
    base_earnings = (
        [{"name": i["name"], "amount": i["amount"]} for i in structure.get("items", []) if i.get("type") == "EARNING"]
        if structure else [{"name": "Basic Salary", "amount": employee.get("gross") or 0}]
    )
    gross = sum(float(i["amount"]) for i in base_earnings)
    ot_pay = _ot(gross, float(attendance.get("overtimeHours") or 0))
    earnings = list(base_earnings) + ([{"name": "Overtime Pay", "amount": ot_pay}] if ot_pay > 0 else [])
    total_earnings = sum(float(i["amount"]) for i in earnings)
    fixed_ded = (
        [{"name": i["name"], "amount": i["amount"]} for i in structure.get("items", []) if i.get("type") == "DEDUCTION"]
        if structure else []
    )
    tds = _tds(total_earnings - sum(float(i["amount"]) for i in fixed_ded))
    deductions = list(fixed_ded) + ([{"name": "Tax Deducted at Source (TDS)", "amount": tds}] if tds > 0 else [])
    total_deductions = sum(float(i["amount"]) for i in deductions)
    net_adj = sum(float(a.get("amount") or 0) for a in adjustments)
    net_payable = total_earnings - total_deductions + net_adj
    emp = {**employee, "gross": gross, "earnings": ot_pay, "deductions": total_deductions, "net": net_payable}
    return {
        "employee": emp, "periodLabel": _period().get("label"), "attendance": attendance,
        "earnings": earnings, "deductions": deductions, "adjustments": adjustments,
        "gross": gross, "totalEarnings": total_earnings, "totalDeductions": total_deductions,
        "netAdjustments": net_adj, "netPayable": net_payable,
    }

@router.get("/payroll/kpis")
def get_kpis():
    employees = _employees()
    return {
        "totalPayroll": sum(float(e.get("net") or 0) for e in employees),
        "totalEmployees": len(employees),
        "pendingApproval": sum(1 for e in employees if e.get("status") == "Calculated"),
        "pendingPayment": sum(1 for e in employees if e.get("status") == "Approved"),
        "trendPct": 3.2,
    }

@router.get("/payroll/period")
def get_period(): return _period()

@router.get("/payroll/activity")
def list_activity(): return list(get_obj("payroll_recent_activity") or [])

@router.get("/payroll/monthly-summary")
def monthly_summary(): return _monthly_summary()

@router.get("/payroll/employees")
def list_employees(search: Optional[str]=None, status: Optional[str]=None, page: Optional[int]=Query(default=None), pageSize: Optional[int]=Query(default=None)):
    items = list(_employees())
    if search:
        q = search.lower()
        items = [e for e in items if q in str(e.get("name") or "").lower() or q in str(e.get("code") or "").lower() or q in str(e.get("department") or "").lower()]
    if status and status != "All":
        items = [e for e in items if e.get("status") == status]
    metrics = _monthly_summary(items)
    if page is not None or pageSize is not None:
        return {**_paginate(items, page or 1, pageSize or 20), "metrics": metrics}
    return {"items": items, "total": len(items), "page": 1, "pageSize": len(items), "metrics": metrics}

@router.get("/payroll/employees/{employee_id}")
def get_employee(employee_id: str):
    row = next((e for e in _employees() if str(e.get("id")) == str(employee_id)), None)
    return row or {"detail": "not found"}

@router.get("/payroll/employees/{employee_id}/review")
def get_review(employee_id: str):
    return _compute_review(employee_id) or {"detail": "not found"}

@router.get("/payroll/employees/{employee_id}/payslip")
def get_payslip(employee_id: str):
    review = _compute_review(employee_id)
    if not review: return {"detail": "not found"}
    emp = review["employee"]
    return {
        "employee": emp, "periodLabel": review["periodLabel"],
        "paymentDate": "2026-08-31" if emp.get("status") == "Paid" else "—",
        "paymentMethod": "Bank Transfer", "referenceNumber": emp.get("paymentRef") or "—",
        "earnings": review["earnings"], "deductions": review["deductions"], "adjustments": review["adjustments"],
        "gross": review["gross"], "totalEarnings": review["totalEarnings"],
        "totalDeductions": review["totalDeductions"], "netAdjustments": review["netAdjustments"],
        "net": review["netPayable"],
    }

@router.get("/payroll/employees/{employee_id}/salary")
def get_salary(employee_id: str):
    s = _structures().get(employee_id)
    if not s: return {"detail": "not found"}
    return {**s, "items": [dict(i) for i in s.get("items") or []]}

@router.put("/payroll/employees/{employee_id}/salary")
def put_salary(employee_id: str, body: dict[str, Any] = Body(default={})):
    structures = _structures()
    prev = structures.get(employee_id) or {}
    items = body.get("items") or prev.get("items") or []
    next_s = {
        "employeeId": employee_id,
        "effectiveFrom": body.get("effectiveFrom") or prev.get("effectiveFrom") or datetime.utcnow().strftime("%Y-%m-%d"),
        "effectiveTo": None, "currency": prev.get("currency") or "USD",
        "payFrequency": prev.get("payFrequency") or "Monthly", "status": "ACTIVE",
        "items": [{**i, "id": i.get("id") or f"{employee_id}-{idx}"} for idx, i in enumerate(items)],
    }
    structures[employee_id] = next_s
    set_obj("payroll_salary_structures", structures)
    employees = _employees()
    for e in employees:
        if str(e.get("id")) == str(employee_id):
            e["gross"] = _gross(next_s)
            e["effectiveFrom"] = next_s["effectiveFrom"]
            break
    set_collection("payroll_employees", employees)
    return {**next_s, "items": [dict(i) for i in next_s["items"]]}

@router.get("/payroll/employees/{employee_id}/history")
def employee_history(employee_id: str):
    return list(_history().get(employee_id) or [])

@router.get("/payroll/history")
def org_history(search: Optional[str]=None):
    rows = []
    for employee_id, hist in _history().items():
        for r in hist:
            if r.get("status") != "PAID": continue
            rows.append({"id": r.get("id"), "period": r.get("month"), "employeeId": employee_id,
                "paidOn": r.get("paymentDate"), "gross": r.get("gross"), "net": r.get("net"),
                "ref": f"TRX-{str(r.get('id') or '').upper()}"})
    for e in _employees():
        if e.get("status") != "Paid": continue
        if any(h["employeeId"] == e.get("id") for h in rows): continue
        rows.append({"id": f"paid-{e.get('id')}", "period": _period().get("label"), "employeeId": e.get("id"),
            "paidOn": "2026-08-31", "gross": e.get("gross"), "net": e.get("net"),
            "ref": e.get("paymentRef") or f"TRX-{e.get('code')}"})
    if search:
        q = search.lower()
        employees = {e.get("id"): e for e in _employees()}
        rows = [r for r in rows if q in str(r.get("period") or "").lower() or q in str(r.get("ref") or "").lower()
            or q in str((employees.get(r.get("employeeId")) or {}).get("name") or "").lower()
            or q in str((employees.get(r.get("employeeId")) or {}).get("code") or "").lower()]
    return rows

@router.get("/payroll/run/checks")
def run_checks(): return list(get_obj("payroll_run_checks") or [])

@router.get("/payroll/run/preview")
def run_preview():
    employees = _employees()
    return {
        "employees": [dict(e) for e in employees],
        "totalGross": sum(float(e.get("gross") or 0) for e in employees),
        "totalEarnings": sum(float(e.get("earnings") or 0) for e in employees),
        "totalDeductions": sum(float(e.get("deductions") or 0) for e in employees),
        "estimatedNet": sum(float(e.get("net") or 0) for e in employees),
    }

@router.post("/payroll/run")
def run_payroll(body: dict[str, Any] = Body(default={})):
    period = _period()
    if body.get("year"): period["year"] = body["year"]
    if body.get("month"): period["monthIndex"] = body["month"]
    period["status"] = "Generated"
    set_obj("payroll_period_meta", period)
    return {"ok": True, "period": period}

@router.post("/payroll/employees/{employee_id}/approve")
def approve(employee_id: str):
    employees = _employees()
    for e in employees:
        if str(e.get("id")) == str(employee_id):
            e["status"] = "Approved"
            set_collection("payroll_employees", employees)
            return {"ok": True}
    return {"detail": "not found"}

@router.post("/payroll/employees/{employee_id}/pay")
def pay(employee_id: str, body: dict[str, Any] = Body(default={})):
    employees = _employees()
    for e in employees:
        if str(e.get("id")) == str(employee_id):
            e["status"] = "Paid"
            e["paymentRef"] = body.get("reference") or f"TRX-{datetime.utcnow().strftime('%H%M%S')}"
            set_collection("payroll_employees", employees)
            return {"ok": True, "paymentRef": e["paymentRef"]}
    return {"detail": "not found"}
