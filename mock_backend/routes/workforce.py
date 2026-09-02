"""Workforce module mock routes — employments, departments, attendance, org-masters."""
from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Body, Query
from store import get_collection, get_obj, next_id, set_collection, set_obj

router = APIRouter(tags=["workforce"])

def _now_iso():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

def _today():
    return datetime.utcnow().strftime("%Y-%m-%d")

def _paginate(items, page=1, page_size=20):
    page = max(1, int(page or 1))
    page_size = max(1, min(int(page_size or 20), 100))
    total = len(items)
    start = (page - 1) * page_size
    return {"items": items[start:start + page_size], "total": total, "page": page, "pageSize": page_size}

def _ensure_schema_departments():
    schema = get_collection("schema_departments")
    if schema:
        return schema
    depts = get_collection("departments")
    out = []
    for d in depts:
        out.append({
            "id": d.get("id"),
            "name": d.get("name"),
            "department_head_employment_id": d.get("department_head_employment_id") or d.get("headEmploymentId"),
            "is_archived": bool(d.get("is_archived") or d.get("status") == "INACTIVE"),
            "created_at": d.get("created_at") or _now_iso(),
            "created_by": d.get("created_by") or 1,
        })
    set_collection("schema_departments", out)
    return out

def _person(pid):
    return next((p for p in get_collection("persons") if p.get("id") == pid), None)

def _dept(did):
    return next((d for d in _ensure_schema_departments() if d.get("id") == did), None)

def _position(pid):
    return next((p for p in get_collection("positions") if p.get("id") == pid), None)

def _location(lid):
    return next((l for l in get_collection("locations") if l.get("id") == lid), None)

def _shift(sid):
    return next((s for s in get_collection("shifts") if s.get("id") == sid), None)

def _login(eid):
    return next((u for u in get_collection("login_users") if u.get("employment_id") == eid), None)

def _active_assignment(eid):
    rows = [a for a in get_collection("employment_assignments") if a.get("employment_id") == eid and a.get("effective_to") is None]
    return rows[0] if rows else None

def _enrich_employment(e):
    person = _person(e.get("person_id"))
    assignment = _active_assignment(e.get("id"))
    dept = _dept(assignment.get("department_id")) if assignment else None
    position = _position(assignment.get("position_id")) if assignment else None
    location = _location(assignment.get("location_id")) if assignment else None
    login = _login(e.get("id"))
    full_name = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip() if person else e.get("employee_code")
    state = e.get("current_state") or e.get("status") or "ACTIVE"
    if state == "ACTIVE":
        state = "CONFIRMED"
    if state == "INACTIVE":
        state = "RESIGNED"
    return {
        **e,
        "current_state": state,
        "employment_type": e.get("employment_type") or "FULL_TIME",
        "fullName": full_name,
        "firstName": (person or {}).get("first_name") or "",
        "lastName": (person or {}).get("last_name") or "",
        "email": (login or {}).get("email") or (person or {}).get("email") or (person or {}).get("personal_email") or "",
        "phone": (person or {}).get("phone") or (person or {}).get("personal_phone") or "",
        "departmentName": (dept or {}).get("name") or "—",
        "positionName": (position or {}).get("name") or "—",
        "locationName": (location or {}).get("name") or "—",
        "hasLogin": bool(login),
        "avatarInitials": "".join(p[0] for p in full_name.split()[:2]).upper() if full_name else "?",
    }

def _emp_metrics(items):
    return {
        "total": len(items),
        "active": sum(1 for e in items if e.get("current_state") in ("CONFIRMED", "PROBATION", "ONBOARDING", "ACTIVE")),
        "archived": sum(1 for e in items if e.get("current_state") in ("RESIGNED", "TERMINATED", "ALUMNI", "INACTIVE")),
    }

@router.get("/workforce/employments")
def list_employments(search: Optional[str] = None, status: Optional[str] = None, page: Optional[int] = Query(default=None), pageSize: Optional[int] = Query(default=None)):
    items = [_enrich_employment(e) for e in get_collection("employments")]
    if search:
        q = search.lower()
        items = [e for e in items if q in str(e.get("employee_code") or "").lower() or q in str(e.get("fullName") or "").lower() or q in str(e.get("email") or "").lower() or q in str(e.get("departmentName") or "").lower() or q in str(e.get("positionName") or "").lower()]
    if status:
        items = [e for e in items if e.get("current_state") == status]
    metrics = _emp_metrics(items)
    if page is not None or pageSize is not None:
        return {**_paginate(items, page or 1, pageSize or 20), "metrics": metrics}
    return {"items": items, "total": len(items), "metrics": metrics}

@router.get("/workforce/employments/{employment_id}")
def get_employment(employment_id: int):
    emp = next((e for e in get_collection("employments") if e.get("id") == employment_id), None)
    if not emp:
        return {"detail": "not found"}
    person = _person(emp.get("person_id"))
    if not person:
        return {"detail": "person not found"}
    assignment = _active_assignment(employment_id)
    login = _login(employment_id)
    return {
        "employment": dict(emp),
        "person": dict(person),
        "currentAssignment": dict(assignment) if assignment else None,
        "department": dict(_dept(assignment["department_id"])) if assignment and _dept(assignment.get("department_id")) else None,
        "position": dict(_position(assignment["position_id"])) if assignment and _position(assignment.get("position_id")) else None,
        "location": dict(_location(assignment["location_id"])) if assignment and _location(assignment.get("location_id")) else None,
        "shift": dict(_shift(assignment["shift_id"])) if assignment and _shift(assignment.get("shift_id")) else None,
        "stateHistory": [],
        "assignmentHistory": [dict(a) for a in get_collection("employment_assignments") if a.get("employment_id") == employment_id],
        "roleIds": [],
        "roleNames": [],
        "currentSalary": None,
        "hasLogin": bool(login),
        "loginEmail": (login or {}).get("email"),
    }

@router.post("/workforce/employments")
def create_employment(body: dict[str, Any] = Body(default={})):
    now = _now_iso()
    persons = get_collection("persons")
    pid = next_id("persons")
    persons.append({"id": pid, "first_name": (body.get("firstName") or "").strip(), "last_name": (body.get("lastName") or "").strip(), "personal_email": body.get("personalEmail"), "personal_phone": body.get("personalPhone"), "created_at": now, "updated_at": now})
    set_collection("persons", persons)
    employments = get_collection("employments")
    eid = next_id("employments")
    row = {"id": eid, "person_id": pid, "employee_code": f"EMP-{str(eid).zfill(3)}", "employment_type": body.get("employmentType") or "FULL_TIME", "current_state": "ONBOARDING", "status": "ACTIVE", "joining_date": body.get("joiningDate") or _today(), "created_at": now, "updated_at": now, "changed_by": 1}
    employments.append(row)
    set_collection("employments", employments)
    assigns = get_collection("employment_assignments")
    assigns.append({"id": next_id("employment_assignments"), "employment_id": eid, "department_id": body.get("departmentId") or 1, "position_id": body.get("positionId") or 1, "location_id": body.get("locationId") or 1, "shift_id": body.get("shiftId") or 1, "work_mode": body.get("workMode") or "OFFICE", "effective_from": row["joining_date"], "effective_to": None, "created_at": now, "changed_by": 1})
    set_collection("employment_assignments", assigns)
    return _enrich_employment(row)

@router.patch("/workforce/employments/{employment_id}")
def update_employment(employment_id: int, body: dict[str, Any] = Body(default={})):
    employments = get_collection("employments")
    emp = next((e for e in employments if e.get("id") == employment_id), None)
    if not emp:
        return {"detail": "not found"}
    persons = get_collection("persons")
    person = next((p for p in persons if p.get("id") == emp.get("person_id")), None)
    if person:
        if body.get("firstName") is not None:
            person["first_name"] = body["firstName"]
        if body.get("lastName") is not None:
            person["last_name"] = body["lastName"]
        set_collection("persons", persons)
    if body.get("employmentType"):
        emp["employment_type"] = body["employmentType"]
    if body.get("currentState"):
        emp["current_state"] = body["currentState"]
    set_collection("employments", employments)
    return _enrich_employment(emp)

@router.get("/workforce/org-masters")
def org_masters():
    _ensure_schema_departments()
    return {
        "departments": [d for d in get_collection("schema_departments") if not d.get("is_archived")],
        "positions": [p for p in get_collection("positions") if not p.get("is_archived")],
        "locations": [l for l in get_collection("locations") if not l.get("is_archived")],
        "shifts": [s for s in get_collection("shifts") if not s.get("is_archived")],
    }

@router.get("/workforce/employment-options")
def employment_options():
    out = []
    for e in get_collection("employments"):
        person = _person(e.get("person_id"))
        name = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip() if person else e.get("employee_code")
        out.append({"value": str(e.get("id")), "label": f"{name} ({e.get('employee_code')})", "meta": e.get("current_state") or e.get("status")})
    return out

@router.get("/workforce/departments")
def list_departments(search: Optional[str] = None, status: Optional[str] = None, includeArchived: bool = False, page: Optional[int] = Query(default=None), pageSize: Optional[int] = Query(default=None)):
    rows = []
    for d in _ensure_schema_departments():
        rows.append({"id": d.get("id"), "name": d.get("name"), "code": f"DEPT-{str(d.get('id')).zfill(3)}", "headName": "—", "headEmploymentId": d.get("department_head_employment_id"), "staffCount": 0, "isArchived": bool(d.get("is_archived")), "status": "Inactive" if d.get("is_archived") else "Active", "createdAt": d.get("created_at")})
    if search:
        q = search.lower()
        rows = [d for d in rows if q in str(d.get("name") or "").lower()]
    if status and status != "All":
        rows = [d for d in rows if d.get("status") == status]
    if not includeArchived:
        rows = [d for d in rows if not d.get("isArchived")]
    if page is not None or pageSize is not None:
        return _paginate(rows, page or 1, pageSize or 20)
    return {"items": rows, "total": len(rows)}

@router.get("/workforce/departments/{department_id}")
def get_department(department_id: int):
    row = next((d for d in _ensure_schema_departments() if d.get("id") == department_id), None)
    if not row:
        return {"detail": "not found"}
    return {"id": row.get("id"), "name": row.get("name"), "code": f"DEPT-{str(row.get('id')).zfill(3)}", "headName": "—", "headEmploymentId": row.get("department_head_employment_id"), "staffCount": 0, "isArchived": bool(row.get("is_archived")), "status": "Inactive" if row.get("is_archived") else "Active", "createdAt": row.get("created_at")}

@router.get("/workforce/departments/{department_id}/employees")
def list_department_employees(department_id: int):
    emp_ids = [a.get("employment_id") for a in get_collection("employment_assignments") if a.get("department_id") == department_id and a.get("effective_to") is None]
    out = []
    for eid in emp_ids:
        emp = next((e for e in get_collection("employments") if e.get("id") == eid), None)
        if not emp:
            continue
        person = _person(emp.get("person_id"))
        out.append({"employmentId": eid, "employeeCode": emp.get("employee_code"), "name": f"{person.get('first_name', '')} {person.get('last_name', '')}".strip() if person else emp.get("employee_code"), "positionName": "—", "state": emp.get("current_state") or emp.get("status"), "email": ""})
    return out

@router.get("/workforce/departments/{department_id}/employees-available")
def employees_available(department_id: int):
    in_dept = {a.get("employment_id") for a in get_collection("employment_assignments") if a.get("department_id") == department_id and a.get("effective_to") is None}
    out = []
    for e in get_collection("employments"):
        if e.get("id") in in_dept:
            continue
        person = _person(e.get("person_id"))
        name = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip() if person else e.get("employee_code")
        out.append({"value": str(e.get("id")), "label": f"{name} ({e.get('employee_code')})", "meta": e.get("current_state") or e.get("status")})
    return out

@router.post("/workforce/departments/{department_id}/assign")
def assign_employee(department_id: int, body: dict[str, Any] = Body(default={})):
    employment_id = body.get("employmentId")
    if employment_id is None:
        return {"detail": "employmentId required"}
    today, now = _today(), _now_iso()
    assigns = get_collection("employment_assignments")
    current = next((a for a in assigns if a.get("employment_id") == employment_id and a.get("effective_to") is None), None)
    if current and current.get("department_id") == department_id:
        return {"ok": True}
    if current:
        current["effective_to"] = today
    assigns.append({"id": next_id("employment_assignments"), "employment_id": employment_id, "department_id": department_id, "position_id": (current or {}).get("position_id") or 5, "location_id": (current or {}).get("location_id") or 1, "shift_id": (current or {}).get("shift_id") or 1, "work_mode": (current or {}).get("work_mode") or "OFFICE", "effective_from": today, "effective_to": None, "change_reason": "Assigned to department", "created_at": now, "changed_by": 1})
    set_collection("employment_assignments", assigns)
    return {"ok": True}

@router.post("/workforce/departments/{department_id}/remove")
def remove_employee(department_id: int, body: dict[str, Any] = Body(default={})):
    employment_id = body.get("employmentId")
    assigns = get_collection("employment_assignments")
    current = next((a for a in assigns if a.get("employment_id") == employment_id and a.get("department_id") == department_id and a.get("effective_to") is None), None)
    if current:
        current["effective_to"] = _today()
        current["change_reason"] = "Removed from department"
        set_collection("employment_assignments", assigns)
    return {"ok": True}

@router.post("/workforce/departments")
def create_department(body: dict[str, Any] = Body(default={})):
    depts = _ensure_schema_departments()
    row = {"id": next_id("schema_departments"), "name": (body.get("name") or "").strip(), "department_head_employment_id": body.get("headEmploymentId"), "is_archived": bool(body.get("isArchived") or False), "created_at": _now_iso(), "created_by": 1}
    depts.append(row)
    set_collection("schema_departments", depts)
    return {"id": row["id"], "name": row["name"], "code": f"DEPT-{str(row['id']).zfill(3)}", "headName": "—", "headEmploymentId": row.get("department_head_employment_id"), "staffCount": 0, "isArchived": False, "status": "Active", "createdAt": row["created_at"]}

@router.patch("/workforce/departments/{department_id}")
def update_department(department_id: int, body: dict[str, Any] = Body(default={})):
    depts = _ensure_schema_departments()
    row = next((d for d in depts if d.get("id") == department_id), None)
    if not row:
        return {"detail": "not found"}
    if body.get("name") is not None:
        row["name"] = body["name"].strip()
    if "headEmploymentId" in body:
        row["department_head_employment_id"] = body["headEmploymentId"]
    if body.get("isArchived") is not None:
        row["is_archived"] = bool(body["isArchived"])
    set_collection("schema_departments", depts)
    return {"id": row.get("id"), "name": row.get("name"), "code": f"DEPT-{str(row.get('id')).zfill(3)}", "headName": "—", "headEmploymentId": row.get("department_head_employment_id"), "staffCount": 0, "isArchived": bool(row.get("is_archived")), "status": "Inactive" if row.get("is_archived") else "Active", "createdAt": row.get("created_at")}

@router.get("/workforce/shifts/{shift_id}/employees")
def employees_on_shift(shift_id: int):
    emp_ids = [a.get("employment_id") for a in get_collection("employment_assignments") if a.get("shift_id") == shift_id and a.get("effective_to") is None]
    out = []
    for eid in emp_ids:
        emp = next((e for e in get_collection("employments") if e.get("id") == eid), None)
        if not emp:
            continue
        person = _person(emp.get("person_id"))
        out.append({"employmentId": eid, "employeeCode": emp.get("employee_code"), "name": f"{person.get('first_name', '')} {person.get('last_name', '')}".strip() if person else emp.get("employee_code"), "departmentName": "—", "positionName": "—", "state": emp.get("current_state") or emp.get("status")})
    return out

@router.get("/workforce/attendance/dashboard")
def attendance_dashboard():
    return {"kpis": list(get_obj("workforce_attendance_kpis") or []), "weekly": list(get_obj("workforce_weekly_attendance") or []), "recentCheckIns": list(get_obj("workforce_recent_check_ins") or []), "today": list(get_obj("workforce_today_attendance") or []), "corrections": list(get_obj("workforce_attendance_corrections") or [])}

@router.get("/workforce/attendance/today")
def attendance_today(search: Optional[str] = None, status: Optional[str] = None):
    items = list(get_obj("workforce_today_attendance") or [])
    if search:
        q = search.lower()
        items = [r for r in items if q in str(r.get("name") or "").lower() or q in str(r.get("department") or "").lower()]
    if status and status.upper() not in ("ALL",):
        items = [r for r in items if r.get("status") == status]
    return {"items": items, "total": len(items)}

@router.get("/workforce/attendance/corrections")
def attendance_corrections():
    return {"items": list(get_obj("workforce_attendance_corrections") or [])}

@router.get("/workforce/attendance/day/{employment_id}")
def attendance_day(employment_id: str, date: Optional[str] = None):
    return {"employmentId": employment_id, "date": date or _today(), "punches": [{"id": 1, "punch_type": "CHECK_IN", "punch_time": "09:32:14", "is_valid_punch": True, "client_ip": "203.0.113.42", "validation_message": None}, {"id": 2, "punch_type": "CHECK_OUT", "punch_time": "18:41:02", "is_valid_punch": True, "client_ip": "203.0.113.42", "validation_message": None}], "breaks": [{"id": 1, "start": "13:05", "end": "13:45", "duration_min": 40}], "workingHours": 8.2}

@router.get("/workforce/attendance/{attendance_id}")
def attendance_detail(attendance_id: str):
    today = list(get_obj("workforce_today_attendance") or [])
    row = next((r for r in today if str(r.get("id")) == str(attendance_id)), None) or (today[0] if today else None)
    if not row:
        return {"detail": "not found"}
    return {"row": dict(row), "logs": list(get_obj("workforce_attendance_logs") or [])}
