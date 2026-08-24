"""Extra mock routes matching frontend paths. Data lives in data/store.json (via seed)."""
from __future__ import annotations
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Body, HTTPException, Query

from store import get_collection, get_obj, set_collection, set_obj

router = APIRouter(tags=["extras"])


def _now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _now_disp() -> str:
    return datetime.utcnow().strftime("%b %d, %Y %H:%M")


def _append_audit(action: str, target: str, module: str) -> None:
    audits = get_collection("audit_logs")
    audits.insert(0, {
        "id": f"AUD-{int(datetime.utcnow().timestamp())}",
        "action": action,
        "actor": "Current User",
        "actorInitials": "CU",
        "target": target,
        "module": module,
        "timestamp": _now_disp(),
        "timestamp_iso": _now_iso(),
        "ip": "127.0.0.1",
    })
    set_collection("audit_logs", audits)


def _next_id(collection_name: str, counter_key: str) -> int:
    items = get_collection(collection_name) or []
    counters = get_obj("counters") or {}
    n = counters.get(counter_key) or (max((x.get("id") or 0 for x in items), default=0) + 1)
    counters[counter_key] = int(n) + 1
    set_obj("counters", counters)
    return int(n)


def _ensure() -> None:
    if not get_collection("shifts"):
        set_collection("shifts", [
            {"id": 1, "name": "General", "code": "GEN", "start_time": "09:00", "end_time": "18:00",
             "break_minutes": 60, "is_archived": False, "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1},
            {"id": 2, "name": "Early", "code": "EARLY", "start_time": "07:00", "end_time": "16:00",
             "break_minutes": 45, "is_archived": False, "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1},
            {"id": 3, "name": "Night", "code": "NIGHT", "start_time": "22:00", "end_time": "06:00",
             "break_minutes": 30, "is_archived": False, "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1},
        ])
        counters = get_obj("counters") or {}
        counters.setdefault("next_shift", 4)
        set_obj("counters", counters)
    if not get_collection("locations"):
        locs = []
        for i, o in enumerate(get_collection("offices") or [], start=1):
            locs.append({
                "id": i, "name": o.get("name") or f"Location {i}",
                "code": str(o.get("id") or i).upper(),
                "city": o.get("city") or "", "country": o.get("country") or "",
                "timezone": o.get("timezone") or "UTC", "address": o.get("address") or "",
                "postal_code": o.get("postal") or "", "is_archived": False,
                "payroll_region": o.get("currency") or "",
                "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1,
            })
        if not locs:
            locs = [{
                "id": 1, "name": "HQ", "code": "HQ", "city": "Bengaluru", "country": "India",
                "timezone": "Asia/Kolkata", "address": "", "postal_code": "",
                "is_archived": False, "payroll_region": "IN",
                "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1,
            }]
        set_collection("locations", locs)
    if not get_collection("working_weeks"):
        set_collection("working_weeks", [{
            "id": 1, "name": "Standard 5-day",
            "monday": True, "tuesday": True, "wednesday": True, "thursday": True,
            "friday": True, "saturday": False, "sunday": False,
            "effective_from": "2026-01-01", "effective_to": None,
        }])
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
            {"id": 1, "employeeId": "1", "leave_type": "CASUAL", "transaction_type": "CREDIT",
             "days": 12, "reference_type": "POLICY", "created_at": "2026-01-01"},
            {"id": 2, "employeeId": "1", "leave_type": "CASUAL", "transaction_type": "DEBIT",
             "days": -2, "reference_type": "LEAVE_REQUEST", "created_at": "2026-03-12"},
            {"id": 3, "employeeId": "1", "leave_type": "SICK", "transaction_type": "CREDIT",
             "days": 10, "reference_type": "POLICY", "created_at": "2026-01-01"},
        ])
    if not get_collection("holiday_calendars"):
        set_collection("holiday_calendars", [
            {"id": 1, "name": "India Public Holidays 2026", "region": "IN", "year": 2026,
             "is_archived": False, "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1},
            {"id": 2, "name": "US Federal Holidays 2026", "region": "US", "year": 2026,
             "is_archived": False, "created_at": _now_iso(), "updated_at": _now_iso(), "changed_by": 1},
        ])
        counters = get_obj("counters") or {}
        counters.setdefault("next_holiday_calendar", 3)
        set_obj("counters", counters)
    if not get_collection("holidays"):
        set_collection("holidays", [
            {"id": 1, "holiday_calendar_id": 1, "name": "Republic Day", "date": "2026-01-26",
             "holiday_type": "NATIONAL", "recurring_flag": True, "created_at": _now_iso(), "changed_by": 1},
            {"id": 2, "holiday_calendar_id": 1, "name": "Independence Day", "date": "2026-08-15",
             "holiday_type": "NATIONAL", "recurring_flag": True, "created_at": _now_iso(), "changed_by": 1},
            {"id": 3, "holiday_calendar_id": 2, "name": "New Year's Day", "date": "2026-01-01",
             "holiday_type": "NATIONAL", "recurring_flag": True, "created_at": _now_iso(), "changed_by": 1},
        ])
        counters = get_obj("counters") or {}
        counters.setdefault("next_holiday", 4)
        set_obj("counters", counters)
    if not get_obj("organization_settings"):
        profile = get_obj("organization_profile") or {}
        set_obj("organization_settings", {
            "company_name": profile.get("name") or "Bytevon",
            "head_office_location_id": 1,
            "default_timezone": "Asia/Kolkata",
            "default_currency": "INR",
            "logo_reference": None,
        })
    positions = get_collection("positions")
    changed = False
    for p in positions:
        if "is_archived" not in p:
            p["is_archived"] = False
            changed = True
    if changed:
        set_collection("positions", positions)
    if positions and not (get_obj("counters") or {}).get("next_position"):
        counters = get_obj("counters") or {}
        counters["next_position"] = max((p.get("id") or 0 for p in positions), default=0) + 1
        set_obj("counters", counters)


@router.get("/admin/metrics/hub")
def metrics_hub():
    _ensure()
    m = get_obj("metrics") or {}
    users = get_collection("admin_users")
    roles = get_collection("roles")
    return {
        **m,
        "users": len(users),
        "roles": len(roles),
        "activeSessions": m.get("activeSessions", 12),
        "auditEventsToday": m.get("auditEventsToday", 20),
        "configHealth": m.get("configHealth", "Good"),
        "securityScore": m.get("securityScore", 94),
        "mfaAdoption": m.get("mfaAdoption", 0),
        "openAlerts": m.get("openAlerts", 0),
        "activeRoles": sum(1 for r in roles if r.get("status") == "Active"),
        "archivedRoles": sum(1 for r in roles if r.get("status") == "Archived"),
        "activeUsers": sum(1 for u in users if u.get("status") == "Active"),
        "offices": len(get_collection("offices")),
        "departments": len(get_collection("departments")),
        "employees": len(get_collection("employments")),
    }


@router.get("/admin/metrics/roles")
def metrics_roles():
    roles = get_collection("roles")
    users = get_collection("admin_users")
    return {
        "totalRoles": len(roles),
        "activeRoles": sum(1 for r in roles if r.get("status") == "Active"),
        "activeUsers": sum(1 for u in users if u.get("status") == "Active"),
        "archivedRoles": sum(1 for r in roles if r.get("status") == "Archived"),
    }


@router.get("/admin/metrics/leave")
def metrics_leave():
    _ensure()
    return {
        "leaveTypes": len(get_collection("leave_types")),
        "pendingRequests": 7,
        "approvedThisMonth": 23,
        "avgBalanceDays": 12,
    }


@router.get("/admin/metrics/attendance")
def metrics_attendance():
    return {"presentToday": 42, "lateToday": 3, "onLeaveToday": 5, "remoteCheckIns": 8}


@router.get("/dashboard/executive")
def dashboard_executive():
    return {
        "kpis": {
            "employees": len(get_collection("employments")),
            "users": len(get_collection("admin_users")),
            "roles": len(get_collection("roles")),
            "activeProjects": 8,
            "openLeads": 14,
            "pendingApprovals": 5,
        },
        "recentActivities": [{
            "id": 1, "title": "Role updated", "module": "Admin",
            "time": _now_disp(), "status": "COMPLETED", "icon": "edit_note",
        }],
        "alerts": [],
    }


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
    items = list(get_collection("leave_ledger"))
    if employeeId is not None:
        items = [
            x for x in items
            if str(x.get("employeeId") or x.get("employee_id") or "") == str(employeeId)
        ]
    return items


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


@router.get("/organization/settings")
def get_org_settings():
    _ensure()
    return get_obj("organization_settings") or {
        "company_name": (get_obj("organization_profile") or {}).get("name") or "Bytevon",
        "head_office_location_id": 1,
        "default_timezone": "Asia/Kolkata",
        "default_currency": "INR",
        "logo_reference": None,
    }


@router.patch("/organization/settings")
def patch_org_settings(body: dict[str, Any] = Body(default={})):
    _ensure()
    cur = get_obj("organization_settings") or {}
    cur.update(body)
    cur["updated_at"] = _now_iso()
    set_obj("organization_settings", cur)
    return cur


@router.get("/admin/offices/head-options")
def head_options():
    out = []
    for o in get_collection("offices"):
        out.append({
            "id": str(o.get("id")), "name": o.get("name"),
            "country": o.get("country") or "", "city": o.get("city") or "",
            "timezone": o.get("timezone") or "", "currency": o.get("currency") or "",
            "fiscal": o.get("fiscal") or "", "address": o.get("address") or "",
            "postal": o.get("postal") or "",
        })
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


@router.post("/organization/locations")
def create_location(body: dict[str, Any] = Body(default={})):
    _ensure()
    locs = get_collection("locations")
    n = _next_id("locations", "next_location")
    row = {
        "id": body.get("id") or n,
        "name": body.get("name") or f"Location {n}",
        "code": body.get("code") or f"LOC{n}",
        "city": body.get("city") or "",
        "country": body.get("country") or "",
        "timezone": body.get("timezone") or "UTC",
        "address": body.get("address") or "",
        "postal_code": body.get("postal_code") or body.get("postalCode") or "",
        "payroll_region": body.get("payroll_region") or body.get("payrollRegion") or "",
        "is_archived": False,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "changed_by": body.get("changed_by") or 1,
    }
    locs.append(row)
    set_collection("locations", locs)
    _append_audit("Location created", row["name"], "Organization")
    return row


@router.patch("/organization/locations/{location_id}")
@router.put("/organization/locations/{location_id}")
def update_location(location_id: int, body: dict[str, Any] = Body(default={})):
    _ensure()
    locs = get_collection("locations")
    row = next((x for x in locs if x.get("id") == location_id), None)
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    for k, v in body.items():
        if k != "id":
            row[k] = v
    row["updated_at"] = _now_iso()
    set_collection("locations", locs)
    return row


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


@router.post("/organization/shifts")
def create_shift(body: dict[str, Any] = Body(default={})):
    _ensure()
    shifts = get_collection("shifts")
    n = _next_id("shifts", "next_shift")
    name = body.get("name") or f"Shift {n}"
    code = body.get("code") or name[:4].upper().replace(" ", "")
    row = {
        "id": body.get("id") or n,
        "name": name,
        "code": code,
        "start_time": body.get("start_time") or body.get("startTime") or "09:00",
        "end_time": body.get("end_time") or body.get("endTime") or "18:00",
        "break_minutes": body.get("break_minutes") if body.get("break_minutes") is not None else body.get("breakMinutes", 60),
        "is_archived": False,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "changed_by": body.get("changed_by") or 1,
    }
    shifts.append(row)
    set_collection("shifts", shifts)
    _append_audit("Shift created", name, "Organization")
    return row


@router.patch("/organization/shifts/{shift_id}")
@router.put("/organization/shifts/{shift_id}")
def update_shift(shift_id: int, body: dict[str, Any] = Body(default={})):
    _ensure()
    shifts = get_collection("shifts")
    s = next((x for x in shifts if x.get("id") == shift_id), None)
    if not s:
        raise HTTPException(status_code=404, detail="not found")
    mapping = {"startTime": "start_time", "endTime": "end_time", "breakMinutes": "break_minutes"}
    for k, v in body.items():
        if k == "id":
            continue
        s[mapping.get(k, k)] = v
    s["updated_at"] = _now_iso()
    set_collection("shifts", shifts)
    _append_audit("Shift updated", s.get("name") or str(shift_id), "Organization")
    return s


@router.post("/organization/shifts/{shift_id}/archive")
def archive_shift(shift_id: int):
    _ensure()
    shifts = get_collection("shifts")
    s = next((x for x in shifts if x.get("id") == shift_id), None)
    if not s:
        raise HTTPException(status_code=404, detail="not found")
    s["is_archived"] = True
    s["updated_at"] = _now_iso()
    set_collection("shifts", shifts)
    return {"ok": True, "id": shift_id}


@router.get("/organization/working-weeks")
def list_working_weeks():
    _ensure()
    items = get_collection("working_weeks")
    return {"items": items, "total": len(items)}


# ---- Holiday calendars ----

@router.get("/organization/holiday-calendars")
def list_holiday_calendars():
    _ensure()
    items = get_collection("holiday_calendars") or []
    return {"items": items, "total": len(items)}


@router.get("/organization/holiday-calendars/{calendar_id}")
def get_holiday_calendar(calendar_id: int):
    _ensure()
    return next((c for c in (get_collection("holiday_calendars") or []) if c.get("id") == calendar_id), None)


@router.post("/organization/holiday-calendars")
def create_holiday_calendar(body: dict[str, Any] = Body(default={})):
    """POST /api/v1/organization/holiday-calendars"""
    _ensure()
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    n = _next_id("holiday_calendars", "next_holiday_calendar")
    now = _now_iso()
    row = {
        "id": n,
        "name": name,
        "region": body.get("region"),
        "year": body.get("year"),
        "is_archived": False,
        "created_at": now,
        "updated_at": now,
        "changed_by": 1,
    }
    items = get_collection("holiday_calendars") or []
    items.append(row)
    set_collection("holiday_calendars", items)
    _append_audit("Holiday calendar created", name, "Organization")
    return row


@router.patch("/organization/holiday-calendars/{calendar_id}")
def update_holiday_calendar(calendar_id: int, body: dict[str, Any] = Body(default={})):
    _ensure()
    items = list(get_collection("holiday_calendars") or [])
    row = next((c for c in items if c.get("id") == calendar_id), None)
    if not row:
        raise HTTPException(status_code=404, detail="Calendar not found")
    if body.get("name") is not None:
        row["name"] = str(body["name"]).strip()
    if "is_archived" in body:
        row["is_archived"] = bool(body["is_archived"])
    if "region" in body:
        row["region"] = body["region"]
    if "year" in body:
        row["year"] = body["year"]
    row["updated_at"] = _now_iso()
    set_collection("holiday_calendars", items)
    return row


# ---- Holidays ----

@router.get("/organization/holidays")
def list_holidays(calendarId: Optional[int] = None):
    _ensure()
    items = get_collection("holidays") or []
    if calendarId is not None:
        items = [h for h in items if h.get("holiday_calendar_id") == calendarId]
    return {"items": items, "total": len(items)}


@router.post("/organization/holidays")
def create_holiday(body: dict[str, Any] = Body(default={})):
    """POST /api/v1/organization/holidays"""
    _ensure()
    cal_id = body.get("holiday_calendar_id")
    if cal_id is None:
        raise HTTPException(status_code=400, detail="holiday_calendar_id is required")
    cal_id = int(cal_id)
    name = (body.get("name") or "").strip()
    date = (body.get("date") or "").strip()
    if not name or not date:
        raise HTTPException(status_code=400, detail="name and date are required")

    calendars = get_collection("holiday_calendars") or []
    if not any(c.get("id") == cal_id for c in calendars):
        raise HTTPException(status_code=404, detail="Holiday calendar not found")

    n = _next_id("holidays", "next_holiday")
    row = {
        "id": n,
        "holiday_calendar_id": cal_id,
        "name": name,
        "date": date,
        "holiday_type": body.get("holiday_type") or "COMPANY",
        "recurring_flag": bool(body.get("recurring_flag", False)),
        "is_optional": bool(body.get("is_optional", False)),
        "created_at": _now_iso(),
        "changed_by": 1,
    }
    items = get_collection("holidays") or []
    items.append(row)
    set_collection("holidays", items)
    _append_audit("Holiday created", name, "Organization")
    return row


# ---- Positions ----

@router.get("/organization/positions")
def list_positions(includeArchived: bool = Query(default=False)):
    _ensure()
    items = list(get_collection("positions"))
    if not includeArchived:
        items = [x for x in items if not x.get("is_archived")]
    return {"items": items, "total": len(items)}


@router.get("/organization/positions/{position_id}")
def get_position(position_id: int):
    _ensure()
    return next((p for p in get_collection("positions") if p.get("id") == position_id), None)


@router.post("/organization/positions")
def create_position(body: dict[str, Any] = Body(default={})):
    """POST /api/v1/organization/positions"""
    _ensure()
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    n = _next_id("positions", "next_position")
    now = _now_iso()
    row = {
        "id": n,
        "name": name,
        "is_archived": False,
        "created_at": now,
        "updated_at": now,
    }
    items = get_collection("positions") or []
    items.append(row)
    set_collection("positions", items)
    _append_audit("Position created", name, "Organization")
    return row


@router.patch("/organization/positions/{position_id}")
def update_position(position_id: int, body: dict[str, Any] = Body(default={})):
    _ensure()
    items = list(get_collection("positions") or [])
    row = next((p for p in items if p.get("id") == position_id), None)
    if not row:
        raise HTTPException(status_code=404, detail="Position not found")
    if body.get("name") is not None:
        row["name"] = str(body["name"]).strip()
    if "is_archived" in body:
        row["is_archived"] = bool(body["is_archived"])
    row["updated_at"] = _now_iso()
    set_collection("positions", items)
    return row


@router.get("/organization/departments")
def list_departments_wrapped():
    items = get_collection("departments")
    return {"items": items, "total": len(items)}
