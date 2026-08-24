from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Body, Query

from store import get_collection, get_obj, set_collection, set_obj

router = APIRouter(tags=["admin"])


def _now_disp() -> str:
    return datetime.utcnow().strftime("%b %d, %Y %H:%M")


def _now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


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


def _role_name(role_id: Any) -> str:
    for r in get_collection("roles"):
        if str(r.get("id")) == str(role_id):
            return r.get("name") or str(role_id)
    return str(role_id) if role_id is not None else "—"


@router.get("/rbac/roles")
@router.get("/admin/roles")
def list_roles():
    return get_collection("roles")


@router.get("/rbac/roles/{role_id}")
@router.get("/admin/roles/{role_id}")
def get_role(role_id: str):
    r = next((x for x in get_collection("roles") if str(x.get("id")) == str(role_id)), None)
    if not r:
        return {"detail": "not found"}
    return r


@router.post("/rbac/roles")
@router.post("/admin/roles")
def create_role(body: dict[str, Any] = Body(default={})):
    roles = get_collection("roles")
    counters = get_obj("counters") or {}
    n = counters.get("next_role") or (len(roles) + 1)
    counters["next_role"] = n + 1
    set_obj("counters", counters)
    rid = body.get("id") or f"R-{n:02d}"
    row = {
        "id": rid,
        "name": body.get("name") or f"Role {n}",
        "description": body.get("description") or "",
        "usersCount": 0,
        "permissions": body.get("permissions") or [],
        "status": body.get("status") or "Active",
        "category": body.get("category") or "Standard",
        "coveragePct": body.get("coveragePct") or 0,
        "coverageLabel": body.get("coverageLabel") or "0 modules",
        "created": datetime.utcnow().strftime("%b %d, %Y"),
        "updated": "just now",
    }
    roles.append(row)
    set_collection("roles", roles)
    _append_audit("Role created", row["name"], "Roles")
    return row


@router.patch("/rbac/roles/{role_id}")
@router.patch("/admin/roles/{role_id}")
@router.put("/rbac/roles/{role_id}")
@router.put("/admin/roles/{role_id}")
def update_role(role_id: str, body: dict[str, Any] = Body(default={})):
    roles = get_collection("roles")
    r = next((x for x in roles if str(x.get("id")) == str(role_id)), None)
    if not r:
        return {"detail": "not found"}
    for k, v in body.items():
        if k != "id":
            r[k] = v
    r["updated"] = "just now"
    set_collection("roles", roles)
    _append_audit("Role updated", r.get("name") or role_id, "Roles")
    return r


@router.post("/rbac/roles/{role_id}/permissions")
def set_role_permissions(role_id: str, body: dict[str, Any] = Body(default={})):
    roles = get_collection("roles")
    r = next((x for x in roles if str(x.get("id")) == str(role_id)), None)
    if not r:
        return {"detail": "not found"}
    perms = body.get("permissions")
    if perms is None and isinstance(body, dict):
        flat = []
        for mod, actions in body.items():
            if mod in ("permissions", "id"):
                continue
            if isinstance(actions, dict):
                for act, on in actions.items():
                    if on:
                        flat.append(f"{mod}.{str(act).lower()}")
        perms = flat
    if perms is not None:
        r["permissions"] = perms
        r["updated"] = "just now"
        set_collection("roles", roles)
    return r


@router.delete("/rbac/roles/{role_id}")
@router.delete("/admin/roles/{role_id}")
def delete_role(role_id: str):
    roles = get_collection("roles")
    set_collection("roles", [x for x in roles if str(x.get("id")) != str(role_id)])
    return {"ok": True}


@router.get("/rbac/resources")
def list_resources():
    return get_collection("resources")


@router.get("/rbac/permissions")
def list_permissions():
    return get_collection("permissions")


@router.get("/rbac/scopes")
def list_scopes():
    return [
        {"id": 1, "name": "ORGANIZATION"},
        {"id": 2, "name": "DEPARTMENT"},
        {"id": 3, "name": "TEAM"},
        {"id": 4, "name": "SELF"},
    ]


@router.get("/admin/users")
def list_users(search: Optional[str] = None, status: Optional[str] = None):
    items = list(get_collection("admin_users"))
    if search:
        q = search.lower()
        items = [
            u for u in items
            if q in (u.get("name") or "").lower()
            or q in (u.get("email") or "").lower()
            or q in (u.get("role") or "").lower()
            or q in (u.get("employeeCode") or "").lower()
        ]
    if status:
        items = [u for u in items if (u.get("status") or "").lower() == status.lower()]
    return {
        "items": items,
        "total": len(items),
        "locked": sum(1 for u in items if u.get("status") == "Locked"),
        "active": sum(1 for u in items if u.get("status") == "Active"),
    }


@router.get("/admin/users/{user_id}")
def get_user(user_id: str):
    u = next((x for x in get_collection("admin_users") if str(x.get("id")) == str(user_id)), None)
    if not u:
        return {"detail": "not found"}
    login = next((x for x in get_collection("login_users") if str(x.get("id")) == str(user_id)), None)
    emp_id = u.get("employmentId") or (login or {}).get("employment_id")
    emp = next((e for e in get_collection("employments") if e.get("id") == emp_id), None)
    person = None
    if emp:
        person = next((p for p in get_collection("persons") if p.get("id") == emp.get("person_id")), None)
    role_ids = [er.get("role_id") for er in get_collection("employee_roles") if er.get("employment_id") == emp_id]
    return {
        **u,
        "login": login,
        "employment": emp,
        "person": person,
        "roleIds": role_ids,
        "roleNames": [_role_name(rid) for rid in role_ids] or ([u.get("role")] if u.get("role") else []),
    }


@router.get("/admin/employments-without-login")
def employments_without_login():
    logins = get_collection("login_users")
    linked = {l.get("employment_id") for l in logins}
    out = []
    persons = {p.get("id"): p for p in get_collection("persons")}
    depts = {d.get("id"): d for d in get_collection("departments")}
    positions = {p.get("id"): p for p in get_collection("positions")}
    assignments = get_collection("employment_assignments")
    for e in get_collection("employments"):
        if e.get("id") in linked:
            continue
        person = persons.get(e.get("person_id"))
        asg = next((a for a in assignments if a.get("employment_id") == e.get("id") and a.get("effective_to") is None), None)
        dept = depts.get((asg or {}).get("department_id")) if asg else None
        pos = positions.get((asg or {}).get("position_id")) if asg else None
        name = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip() if person else e.get("employee_code")
        out.append({
            "employmentId": e.get("id"),
            "employeeCode": e.get("employee_code") or "—",
            "name": name or "—",
            "department": (dept or {}).get("name") or "—",
            "position": (pos or {}).get("name") or "—",
            "joiningDate": e.get("joining_date") or "",
        })
    return out


@router.post("/admin/users")
def create_user(body: dict[str, Any] = Body(default={})):
    users = get_collection("admin_users")
    logins = get_collection("login_users")
    counters = get_obj("counters") or {}
    employment_id = body.get("employmentId") or body.get("employment_id")
    email = (body.get("email") or "").strip().lower()
    temp_pw = body.get("temporaryPassword") or body.get("temporary_password") or body.get("password") or "Pass@123"
    role_id = body.get("roleId") or body.get("role_id")
    if employment_id is not None and any(l.get("employment_id") == employment_id for l in logins):
        return {"detail": "This employee already has a login account"}
    if email and any((u.get("email") or "").lower() == email for u in users):
        return {"detail": "Email is already in use", "email": email}
    n = counters.get("next_login") or (len(logins) + 1)
    counters["next_login"] = n + 1
    counters["next_user"] = counters.get("next_user", n) + 1
    set_obj("counters", counters)
    emp = next((e for e in get_collection("employments") if e.get("id") == employment_id), None)
    person = None
    if emp:
        person = next((p for p in get_collection("persons") if p.get("id") == emp.get("person_id")), None)
    name = body.get("name") or body.get("full_name")
    if not name and person:
        name = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip()
    if not name:
        name = f"User {n}"
    if not email:
        email = f"user{n}@bytevon.local"
    asg = next((a for a in get_collection("employment_assignments") if a.get("employment_id") == employment_id and a.get("effective_to") is None), None)
    dept_name = ""
    if asg:
        d = next((x for x in get_collection("departments") if x.get("id") == asg.get("department_id")), None)
        dept_name = (d or {}).get("name") or ""
    role_name = _role_name(role_id) if role_id is not None else (body.get("role") or "—")
    now = _now_iso()
    login_row = {
        "id": n, "employment_id": employment_id, "email": email, "temporary_password": temp_pw,
        "status": "ACTIVE", "failed_attempt_count": 0, "locked_until": None, "last_login_at": None,
        "created_at": now, "updated_at": now,
    }
    logins.append(login_row)
    set_collection("login_users", logins)
    if employment_id is not None and role_id is not None:
        er = get_collection("employee_roles")
        if not any(x.get("employment_id") == employment_id and str(x.get("role_id")) == str(role_id) for x in er):
            er.append({"employment_id": employment_id, "role_id": role_id, "assigned_at": now, "changed_by": 1})
            set_collection("employee_roles", er)
    admin_row = {
        "id": n, "employmentId": employment_id, "name": name, "email": email, "role": role_name,
        "department": dept_name or body.get("department") or "—", "status": "Active",
        "lastLogin": "Never", "lastLoginAt": None,
        "initials": "".join(p[0] for p in name.split()[:2]).upper() or "U",
        "employeeCode": (emp or {}).get("employee_code") or "—",
    }
    users.append(admin_row)
    set_collection("admin_users", users)
    auth_users = get_collection("auth_users")
    auth_users.append({"email": email, "password": temp_pw, "login_id": n, "name": name, "employment_id": employment_id or n, "roles": [role_name] if role_name != "—" else []})
    set_collection("auth_users", auth_users)
    _append_audit("User created", name, "Users")
    return login_row


@router.patch("/admin/users/{user_id}")
@router.put("/admin/users/{user_id}")
def update_user(user_id: str, body: dict[str, Any] = Body(default={})):
    users = get_collection("admin_users")
    u = next((x for x in users if str(x.get("id")) == str(user_id)), None)
    if not u:
        return {"detail": "not found"}
    body = dict(body)
    temp = body.pop("temporaryPassword", None) or body.pop("temporary_password", None)
    status_map = {"Active": "ACTIVE", "Inactive": "INACTIVE", "Locked": "LOCKED"}
    for k, v in list(body.items()):
        if k != "id":
            u[k] = v
    logins = get_collection("login_users")
    login = next((x for x in logins if str(x.get("id")) == str(user_id)), None)
    if login:
        if temp is not None:
            login["temporary_password"] = temp
        if "email" in body:
            login["email"] = body["email"]
        if "status" in body:
            st = body["status"]
            login["status"] = status_map.get(st, st.upper() if isinstance(st, str) else st)
        login["updated_at"] = _now_iso()
        set_collection("login_users", logins)
    u["lastActive"] = "just now"
    set_collection("admin_users", users)
    _append_audit("User updated", u.get("name") or user_id, "Users")
    return u


@router.post("/admin/users/{user_id}/lock")
def lock_user(user_id: str):
    users = get_collection("admin_users")
    u = next((x for x in users if str(x.get("id")) == str(user_id)), None)
    if not u:
        return {"detail": "not found"}
    u["status"] = "Locked"
    set_collection("admin_users", users)
    logins = get_collection("login_users")
    login = next((x for x in logins if str(x.get("id")) == str(user_id)), None)
    if login:
        login["status"] = "LOCKED"
        set_collection("login_users", logins)
    _append_audit("User locked", u.get("name") or user_id, "Users")
    return u


@router.post("/admin/users/{user_id}/unlock")
def unlock_user(user_id: str):
    users = get_collection("admin_users")
    u = next((x for x in users if str(x.get("id")) == str(user_id)), None)
    if not u:
        return {"detail": "not found"}
    u["status"] = "Active"
    set_collection("admin_users", users)
    logins = get_collection("login_users")
    login = next((x for x in logins if str(x.get("id")) == str(user_id)), None)
    if login:
        login["status"] = "ACTIVE"
        login["failed_attempt_count"] = 0
        login["locked_until"] = None
        set_collection("login_users", logins)
    _append_audit("User unlocked", u.get("name") or user_id, "Users")
    return u


@router.delete("/admin/users/{user_id}")
def delete_user(user_id: str):
    users = get_collection("admin_users")
    set_collection("admin_users", [x for x in users if str(x.get("id")) != str(user_id)])
    logins = get_collection("login_users")
    set_collection("login_users", [x for x in logins if str(x.get("id")) != str(user_id)])
    return {"ok": True}


@router.get("/admin/settings/leave-accrual")
def get_leave_accrual():
    return get_obj("leave_accrual_policy") or {"maxCarryOverDays": 10, "minimumNoticeDays": 7}


@router.patch("/admin/settings/leave-accrual")
@router.put("/admin/settings/leave-accrual")
def put_leave_accrual(body: dict[str, Any] = Body(default={})):
    cur = get_obj("leave_accrual_policy") or {}
    cur.update(body)
    set_obj("leave_accrual_policy", cur)
    return cur


@router.get("/admin/settings/attendance")
def get_attendance_settings():
    return get_obj("attendance_settings") or {
        "shiftStart": "09:00", "shiftEnd": "18:00", "graceMinutes": 15,
        "earlyOutMinutes": 30, "otMinMinutes": 60, "allowRemoteCheckIn": True,
    }


@router.patch("/admin/settings/attendance")
@router.put("/admin/settings/attendance")
def put_attendance_settings(body: dict[str, Any] = Body(default={})):
    cur = get_obj("attendance_settings") or {}
    cur.update(body)
    set_obj("attendance_settings", cur)
    return cur


@router.get("/admin/offices")
def list_offices():
    return get_collection("offices")


@router.get("/admin/offices/{office_id}")
def get_office(office_id: str):
    o = next((x for x in get_collection("offices") if str(x.get("id")) == str(office_id)), None)
    return o or {"detail": "not found"}


@router.post("/admin/offices")
def create_office(body: dict[str, Any] = Body(default={})):
    offices = get_collection("offices")
    oid = body.get("id") or (body.get("name") or "office").lower().replace(" ", "-")[:12]
    row = {
        "id": oid, "name": body.get("name") or oid, "country": body.get("country") or "",
        "city": body.get("city") or "", "timezone": body.get("timezone") or "",
        "currency": body.get("currency") or "", "fiscal": body.get("fiscal") or "",
        "address": body.get("address") or "", "postal": body.get("postal") or "",
    }
    offices.append(row)
    set_collection("offices", offices)
    _append_audit("Office created", row["name"], "Settings")
    return row


@router.patch("/admin/offices/{office_id}")
@router.put("/admin/offices/{office_id}")
def update_office(office_id: str, body: dict[str, Any] = Body(default={})):
    offices = get_collection("offices")
    o = next((x for x in offices if str(x.get("id")) == str(office_id)), None)
    if not o:
        return {"detail": "not found"}
    for k, v in body.items():
        if k != "id":
            o[k] = v
    set_collection("offices", offices)
    return o


@router.get("/audit/logs")
@router.get("/admin/audit/logs")
def list_audit(limit: int = Query(default=200)):
    return get_collection("audit_logs")[:limit]


@router.post("/admin/audit/events")
def create_audit(body: dict[str, Any] = Body(default={})):
    row = {
        "id": f"AUD-{int(datetime.utcnow().timestamp())}",
        "action": body.get("action") or "Action",
        "actor": body.get("actor") or "Current User",
        "actorInitials": body.get("actorInitials") or "CU",
        "target": body.get("target") or "—",
        "module": body.get("module") or "Admin",
        "timestamp": _now_disp(),
        "ip": body.get("ip") or "—",
    }
    audits = get_collection("audit_logs")
    audits.insert(0, row)
    set_collection("audit_logs", audits)
    return row


@router.get("/admin/security/events")
def security_events():
    events = get_collection("security_events")
    if not events:
        events = [
            {
                "id": f"SEC-{i}",
                "eventType": "Login success" if i % 3 else "Failed login",
                "identity": a.get("actor") or "unknown",
                "source": a.get("ip") or "—",
                "timestamp": a.get("timestamp") or _now_disp(),
                "status": "Success" if i % 3 else "Blocked",
            }
            for i, a in enumerate(get_collection("audit_logs")[:20])
        ]
    return events


@router.post("/admin/_reset")
def reset_store():
    from seed import main as seed_main
    seed_main()
    return {"ok": True}
