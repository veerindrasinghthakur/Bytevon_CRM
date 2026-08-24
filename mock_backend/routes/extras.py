"""Extra mock routes matching frontend paths that 404'd."""
from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Body, Query
from store import get_collection, get_obj, set_collection, set_obj

router = APIRouter(tags=["extras"])

def _now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

def _now_disp() -> str:
    return datetime.utcnow().strftime("%b %d, %Y %H:%M")

def _ensure() -> None:
    if not get_collection("leave_types"):
        set_collection("leave_types", [
            {"name": "Annual Leave", "desc": "Standard paid vacation", "days": "21 Days",
             "eligibility": "All Employees", "eligibilityStyle": "bg-secondary/10 text-secondary"},
            {"name": "Sick Leave", "desc": "Medical and health related", "days": "10 Days",
             "eligibility": "All Employees", "eligibilityStyle": "bg-secondary/10 text-secondary"},
            {"name": "Maternity Leave", "desc": "Parental support leave", "days": "90 Days",
             "eligibility": "Female only", "eligibilityStyle": "bg-surface-container text-on-surface-variant"},
            {"name": "Casual Leave", "desc": "Unplanned personal matters", "days": "5 Days",
             "eligibility": "Full-time", "eligibilityStyle": "bg-secondary/10 text-secondary"},
        ])
    if not get_collection("leave_policies"):
        set_collection("leave_policies", [
            {"id": 1, "name": "Casual 2026", "leave_type": "CASUAL", "annual_entitlement": 12,
             "carry_forward_limit": 3, "effective_from": "2026-01-01", "effective_to": None},
            {"id": 2, "name": "Sick 2026", "leave_type": "SICK", "annual_entitlement": 10,
             "carry_forward_limit": 0, "effective_from": "2026-01-01", "effective_to": None},
            {"id": 3, "name": "Earned 2025", "leave_type": "EARNED", "annual_entitlement": 15,
             "carry_forward_limit": 5, "effective_from": "2025-01-01", "effective_to": "2025-12-31"},
        ])
    if not get_collection("leave_ledger"):
        set_collection("leave_ledger", [
            {"id": 1, "leave_type": "CASUAL", "transaction_type": "CREDIT", "days": 12, "reference_type": "POLICY", "created_at": "2026-01-01"},
            {"id": 2, "leave_type": "CASUAL", "transaction_type": "DEBIT", "days": -2, "reference_type": "LEAVE_REQUEST", "created_at": "2026-03-12"},
            {"id": 3, "leave_type": "SICK", "transaction_type": "CREDIT", "days": 10, "reference_type": "POLICY", "created_at": "2026-01-01"},
        ])
    if not get_collection("shifts"):
        set_collection("shifts", [
            {"id": 1, "name": "General", "code": "GEN", "start_time": "09:00", "end_time": "18:00", "break_minutes": 60, "is_archived": False, "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1},
            {"id": 2, "name": "Early", "code": "EARLY", "start_time": "07:00", "end_time": "16:00", "break_minutes": 45, "is_archived": False, "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1},
            {"id": 3, "name": "Night", "code": "NIGHT", "start_time": "22:00", "end_time": "06:00", "break_minutes": 30, "is_archived": False, "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1},
        ])
    if not get_collection("working_weeks"):
        set_collection("working_weeks", [
            {"id": 1, "name": "Standard 5-day", "monday": True, "tuesday": True, "wednesday": True, "thursday": True, "friday": True, "saturday": False, "sunday": False, "effective_from": "2026-01-01", "effective_to": None},
        ])
    if not get_collection("locations"):
        locs = []
        for i, o in enumerate(get_collection("offices") or [], start=1):
            locs.append({"id": i, "name": o.get("name") or f"Location {i}", "code": str(o.get("id") or i).upper(), "city": o.get("city") or "", "country": o.get("country") or "", "timezone": o.get("timezone") or "UTC", "address": o.get("address") or "", "postal_code": o.get("postal") or "", "is_archived": False, "payroll_region": o.get("currency") or "", "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1})
        if not locs:
            locs = [{"id": 1, "name": "HQ", "code": "HQ", "city": "Bengaluru", "country": "India", "timezone": "Asia/Kolkata", "address": "", "postal_code": "", "is_archived": False, "payroll_region": "IN", "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1}]
        set_collection("locations", locs)
    positions = get_collection("positions")
    changed = False
    for p in positions:
        if "is_archived" not in p:
            p["is_archived"] = False
            changed = True
    if changed:
        set_collection("positions", positions)

@router.get("/admin/metrics/hub")
def metrics_hub():
    _ensure()
    m = get_obj("metrics") or {}
    users = get_collection("admin_users")
    roles = get_collection("roles")
    return {**m, "users": len(users), "roles": len(roles), "activeSessions": m.get("activeSessions", 12), "auditEventsToday": m.get("auditEventsToday", 20), "configHealth": m.get("configHealth", "Good"), "activeRoles": sum(1 for r in roles if r.get("status") == "Active"), "archivedRoles": sum(1 for r in roles if r.get("status") == "Archived"), "activeUsers": sum(1 for u in users if u.get("status") == "Active"), "offices": len(get_collection("offices")), "departments": len(get_collection("departments")), "employees": len(get_collection("employments"))}

@router.get("/admin/metrics/roles")
def metrics_roles():
    roles = get_collection("roles")
    users = get_collection("admin_users")
    return {"totalRoles": len(roles), "activeRoles": sum(1 for r in roles if r.get("status") == "Active"), "activeUsers": sum(1 for u in users if u.get("status") == "Active"), "archivedRoles": sum(1 for r in roles if r.get("status") == "Archived")}

@router.get("/admin/metrics/leave")
def metrics_leave():
    _ensure()
    return {"leaveTypes": len(get_collection("leave_types")), "pendingRequests": 7, "approvedThisMonth": 23, "avgBalanceDays": 12}

@router.get("/admin/metrics/attendance")
def metrics_attendance():
    return {"presentToday": 42, "lateToday": 3, "onLeaveToday": 5, "remoteCheckIns": 8}

@router.get("/dashboard/executive")
def dashboard_executive():
    return {"kpis": {"employees": len(get_collection("employments")), "users": len(get_collection("admin_users")), "roles": len(get_collection("roles")), "activeProjects": 8, "openLeads": 14, "pendingApprovals": 5}, "recentActivities": [{"id": 1, "title": "Role updated", "module": "Admin", "time": _now_disp(), "status": "COMPLETED", "icon": "edit_note"}], "alerts": []}

@router.get("/admin/leave/types")
def leave_types():
    _ensure()
    return get_collection("leave_types")

@router.get("/admin/leave/policies")
def leave_policies():
    _ensure()
    return get_collection("leave_policies")

@router.get("/admin/leave/ledger")
def leave_ledger(employeeId: Optional[str] = None):
    _ensure()
    return get_collection("leave_ledger")

@router.get("/admin/settings/organization-profile")
def get_org_profile():
    return get_obj("organization_profile") or {}

@router.patch("/admin/settings/organization-profile")
@router.put("/admin/settings/organization-profile")
def put_org_profile(body: dict[str, Any] = Body(default={})):
    cur = get_obj("organization_profile") or {}
    cur.update(body)
    set_obj("organization_profile", cur)
    return cur

@router.get("/admin/offices/head-options")
def head_options():
    out = []
    for o in get_collection("offices"):
        out.append({"id": str(o.get("id")), "name": o.get("name"), "country": o.get("country") or "", "city": o.get("city") or "", "timezone": o.get("timezone") or "", "currency": o.get("currency") or "", "fiscal": o.get("fiscal") or "", "address": o.get("address") or "", "postal": o.get("postal") or ""})
    return out

@router.get("/organization/locations")
def list_locations(includeArchived: bool = Query(default=False)):
    _ensure()
    items = list(get_collection("locations"))
    if not includeArchived:
        items = [x for x in items if not x.get("is_archived")]
    return {"items": items, "total": len(items)}

@router.get("/organization/locations/{location_id}")
def get_location(location_id: int):
    _ensure()
    return next((x for x in get_collection("locations") if x.get("id") == location_id), None)

@router.get("/organization/shifts")
def list_shifts(includeArchived: bool = Query(default=False)):
    _ensure()
    items = list(get_collection("shifts"))
    if not includeArchived:
        items = [x for x in items if not x.get("is_archived")]
    return {"items": items, "total": len(items)}

@router.get("/organization/shifts/{shift_id}")
def get_shift(shift_id: int):
    _ensure()
    return next((x for x in get_collection("shifts") if x.get("id") == shift_id), None)

@router.get("/organization/working-weeks")
def list_working_weeks():
    _ensure()
    items = get_collection("working_weeks")
    return {"items": items, "total": len(items)}

@router.get("/organization/holiday-calendars")
def list_holiday_calendars():
    items = get_collection("holiday_calendars") or []
    return {"items": items, "total": len(items)}

@router.get("/organization/holidays")
def list_holidays(calendarId: Optional[int] = None):
    items = get_collection("holidays") or []
    if calendarId is not None:
        items = [h for h in items if h.get("holiday_calendar_id") == calendarId]
    return {"items": items, "total": len(items)}

@router.get("/organization/positions")
def list_positions(includeArchived: bool = Query(default=False)):
    _ensure()
    items = list(get_collection("positions"))
    if not includeArchived:
        items = [x for x in items if not x.get("is_archived")]
    return {"items": items, "total": len(items)}

@router.get("/organization/departments")
def list_departments_wrapped():
    items = get_collection("departments")
    return {"items": items, "total": len(items)}
