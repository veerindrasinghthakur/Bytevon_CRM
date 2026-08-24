"""Admin + RBAC + audit + settings — pure JSON CRUD, no validation."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Body, Query

from store import get_collection, get_obj, load, save, set_collection, set_obj

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


@router.get("/admin/metrics")
@router.get("/admin/hub-metrics")
def hub_metrics():
    m = get_obj("metrics") or {}
    users = get_collection("admin_users")
    roles = get_collection("roles")
    return {
        **m,
        "users": len(users),
        "roles": len(roles),
        "activeRoles": sum(1 for r in roles if r.get("status") == "Active"),
        "archivedRoles": sum(1 for r in roles if r.get("status") == "Archived"),
        "activeUsers": sum(1 for u in users if u.get("status") == "Active"),
        "offices": len(get_collection("offices")),
        "departments": len(get_collection("departments")),
        "employees": len(get_collection("employments")),
    }


@router.get("/admin/users")
@router.get("/rbac/users")
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
def get_user(user_id: int):
    users = get_collection("admin_users")
    u = next((x for x in users if x.get("id") == user_id), None)
    if not u:
        return {"detail": "not found"}
    logins = get_collection("login_users")
    login = next((l for l in logins if l.get("id") == user_id), None)
    return {"user": u, "login": login}


@router.post("/admin/users")
def create_user(body: dict[str, Any] = Body(default={})):
    users = get_collection("admin_users")
    logins = get_collection("login_users")
    counters = get_obj("counters") or {}
    new_id = counters.get("next_login") or (len(logins) + 1)
    counters["next_login"] = new_id + 1
    set_obj("counters", counters)
    employment_id = body.get("employmentId") or body.get("employment_id") or new_id
    email = body.get("email") or f"user{new_id}@bytevon.com"
    name = body.get("name") or email.split("@")[0]
    role = body.get("role") or "Employee"
    department = body.get("department") or "—"
    status = body.get("status") or "Active"
    initials = "".join(p[0] for p in name.split()[:2]).upper() or "U"
    row = {
        "id": new_id,
        "employmentId": employment_id,
        "name": name,
        "email": email,
        "role": role,
        "department": department,
        "status": status,
        "lastLogin": "Never",
        "lastLoginAt": None,
        "initials": initials,
        "employeeCode": body.get("employeeCode") or f"EMP-{1000 + new_id}",
    }
    users.append(row)
    set_collection("admin_users", users)
    logins.append({
        "id": new_id,
        "employment_id": employment_id,
        "email": email,
        "temporary_password": body.get("temporaryPassword") or body.get("password") or "Pass@123",
        "status": "ACTIVE" if status == "Active" else status.upper(),
        "failed_attempt_count": 0,
        "locked_until": None,
        "last_login_at": None,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    })
    set_collection("login_users", logins)
    if body.get("roleId"):
        ers = get_collection("employee_roles")
        ers.append({
            "employment_id": employment_id,
            "role_id": body["roleId"],
            "assigned_at": _now_iso(),
            "changed_by": 1,
        })
        set_collection("employee_roles", ers)
    _append_audit("User created", name, "Users")
    return row


@router.patch("/admin/users/{user_id}")
def update_user(user_id: int, body: dict[str, Any] = Body(default={})):
    users = get_collection("admin_users")
    u = next((x for x in users if x.get("id") == user_id), None)
    if not u:
        return {"detail": "not found"}
    for k, v in body.items():
        if k in u or k in ("name", "email", "role", "department", "status", "lastLogin"):
            u[k] = v
    set_collection("admin_users", users)
    logins = get_collection("login_users")
    login = next((l for l in logins if l.get("id") == user_id), None)
    if login:
        if "email" in body:
            login["email"] = body["email"]
        if "status" in body:
            st = body["status"]
            login["status"] = "LOCKED" if st == "Locked" else ("INACTIVE" if st == "Inactive" else "ACTIVE")
        if "temporaryPassword" in body or "password" in body:
            login["temporary_password"] = body.get("temporaryPassword") or body.get("password")
        login["updated_at"] = _now_iso()
        set_collection("login_users", logins)
    _append_audit("User updated", u.get("name", str(user_id)), "Users")
    return u


@router.post("/admin/users/{user_id}/lock")
def lock_user(user_id: int):
    return update_user(user_id, {"status": "Locked"})


@router.post("/admin/users/{user_id}/unlock")
def unlock_user(user_id: int):
    users = get_collection("admin_users")
    u = next((x for x in users if x.get("id") == user_id), None)
    if u:
        u["status"] = "Active"
        set_collection("admin_users", users)
    logins = get_collection("login_users")
    login = next((l for l in logins if l.get("id") == user_id), None)
    if login:
        login["status"] = "ACTIVE"
        login["failed_attempt_count"] = 0
        login["locked_until"] = None
        login["updated_at"] = _now_iso()
        set_collection("login_users", logins)
    _append_audit("User unlocked", (u or {}).get("name", str(user_id)), "Auth")
    return u or {"ok": True}


@router.delete("/admin/users/{user_id}")
def delete_user(user_id: int):
    users = get_collection("admin_users")
    name = next((x.get("name") for x in users if x.get("id") == user_id), str(user_id))
    users = [x for x in users if x.get("id") != user_id]
    set_collection("admin_users", users)
    logins = [l for l in get_collection("login_users") if l.get("id") != user_id]
    set_collection("login_users", logins)
    _append_audit("User deleted", name, "Users")
    return {"ok": True}


@router.get("/admin/employments-without-login")
def employments_without_login():
    logins = get_collection("login_users")
    linked = {l.get("employment_id") for l in logins}
    out = []
    for e in get_collection("employments"):
        if e["id"] in linked:
            continue
        person = next((p for p in get_collection("persons") if p["id"] == e["person_id"]), None)
        asg = next(
            (a for a in get_collection("employment_assignments")
             if a["employment_id"] == e["id"] and a.get("effective_to") is None),
            None,
        )
        dept = next(
            (d for d in get_collection("departments") if asg and d["id"] == asg.get("department_id")),
            None,
        )
        pos = next(
            (p for p in get_collection("positions") if asg and p["id"] == asg.get("position_id")),
            None,
        )
        out.append({
            "employmentId": e["id"],
            "employeeCode": e.get("employee_code"),
            "name": f"{person['first_name']} {person['last_name']}" if person else e.get("employee_code"),
            "department": (dept or {}).get("name", "—"),
            "position": (pos or {}).get("name", "—"),
            "joiningDate": e.get("joining_date"),
        })
    return out


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


@router.get("/rbac/sensitive-fields")
def list_sensitive_fields():
    return []


@router.get("/rbac/roles")
@router.get("/admin/roles")
def list_roles():
    return get_collection("roles")


@router.get("/rbac/roles/{role_id}")
@router.get("/admin/roles/{role_id}")
def get_role(role_id: str):
    roles = get_collection("roles")
    r = next((x for x in roles if str(x.get("id")) == str(role_id)), None)
    return r or {"detail": "not found"}


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
    _append_audit("Role updated", r.get("name", role_id), "Roles")
    return r


@router.delete("/rbac/roles/{role_id}")
@router.delete("/admin/roles/{role_id}")
def delete_role(role_id: str):
    roles = get_collection("roles")
    name = next((x.get("name") for x in roles if str(x.get("id")) == str(role_id)), role_id)
    roles = [x for x in roles if str(x.get("id")) != str(role_id)]
    set_collection("roles", roles)
    _append_audit("Role deleted", name, "Roles")
    return {"ok": True}


@router.post("/rbac/roles/{role_id}/permissions")
def set_role_permissions(role_id: str, body: dict[str, Any] = Body(default={})):
    roles = get_collection("roles")
    r = next((x for x in roles if str(x.get("id")) == str(role_id)), None)
    if not r:
        return {"detail": "not found"}
    if "permissions" in body:
        r["permissions"] = body["permissions"]
    elif "matrix" in body:
        perms = []
        for res, actions in (body["matrix"] or {}).items():
            for act, on in (actions or {}).items():
                if on:
                    perms.append(f"{res}.{act}".lower())
        r["permissions"] = perms
    r["updated"] = "just now"
    set_collection("roles", roles)
    _append_audit("Permission granted", r.get("name", role_id), "Roles")
    return r


@router.post("/rbac/employments/{employment_id}/roles")
def assign_role(employment_id: int, body: dict[str, Any] = Body(default={})):
    role_id = body.get("roleId") or body.get("role_id")
    ers = get_collection("employee_roles")
    ers.append({
        "employment_id": employment_id,
        "role_id": role_id,
        "assigned_at": _now_iso(),
        "changed_by": 1,
    })
    set_collection("employee_roles", ers)
    roles = get_collection("roles")
    for r in roles:
        if str(r.get("id")) == str(role_id):
            r["usersCount"] = r.get("usersCount", 0) + 1
    set_collection("roles", roles)
    return {"ok": True}


@router.delete("/rbac/employments/{employment_id}/roles/{role_id}")
def unassign_role(employment_id: int, role_id: str):
    ers = [
        e for e in get_collection("employee_roles")
        if not (e.get("employment_id") == employment_id and str(e.get("role_id")) == str(role_id))
    ]
    set_collection("employee_roles", ers)
    return {"ok": True}


@router.get("/rbac/employments/{employment_id}/roles")
def employment_roles(employment_id: int):
    return [e for e in get_collection("employee_roles") if e.get("employment_id") == employment_id]


@router.get("/rbac/employments/{employment_id}/effective-permissions")
def effective_permissions(employment_id: int):
    ers = [e for e in get_collection("employee_roles") if e.get("employment_id") == employment_id]
    role_ids = {str(e.get("role_id")) for e in ers}
    roles = [r for r in get_collection("roles") if str(r.get("id")) in role_ids]
    perms = sorted({p for r in roles for p in (r.get("permissions") or [])})
    return {"employmentId": employment_id, "permissions": perms, "roles": [r.get("name") for r in roles]}


@router.get("/audit/logs")
@router.get("/admin/audit/logs")
@router.get("/admin/audit")
def list_audit(
    search: Optional[str] = None,
    module: Optional[str] = None,
    limit: int = Query(default=200, ge=1, le=1000),
):
    items = list(get_collection("audit_logs"))
    if search:
        q = search.lower()
        items = [
            a for a in items
            if q in (a.get("action") or "").lower()
            or q in (a.get("actor") or "").lower()
            or q in (a.get("target") or "").lower()
        ]
    if module:
        items = [a for a in items if (a.get("module") or "").lower() == module.lower()]
    return items[:limit]


@router.get("/audit/logs/{log_id}")
def get_audit(log_id: str):
    return next((a for a in get_collection("audit_logs") if str(a.get("id")) == str(log_id)), None)


@router.post("/audit/logs")
@router.post("/admin/audit/events")
@router.post("/admin/audit/logs")
def create_audit(body: dict[str, Any] = Body(default={})):
    row = {
        "id": f"AUD-{int(datetime.utcnow().timestamp())}",
        "action": body.get("action") or "Action",
        "actor": body.get("actor") or "Current User",
        "actorInitials": body.get("actorInitials") or "CU",
        "target": body.get("target") or "—",
        "module": body.get("module") or "Admin",
        "timestamp": _now_disp(),
        "timestamp_iso": _now_iso(),
        "ip": body.get("ip") or "—",
    }
    audits = get_collection("audit_logs")
    audits.insert(0, row)
    set_collection("audit_logs", audits)
    return row


@router.get("/admin/security/events")
def security_events():
    return get_collection("security_events")


@router.get("/organization/settings")
@router.get("/admin/settings/organization")
def get_org_settings():
    return get_obj("organization_profile") or {}


@router.put("/organization/settings")
@router.put("/admin/settings/organization")
@router.patch("/admin/settings/organization")
def put_org_settings(body: dict[str, Any] = Body(default={})):
    cur = get_obj("organization_profile") or {}
    cur.update(body)
    set_obj("organization_profile", cur)
    _append_audit("Settings saved", "Organization profile", "Settings")
    return cur


@router.get("/admin/settings/attendance")
def get_attendance_settings():
    return get_obj("attendance_settings") or {}


@router.put("/admin/settings/attendance")
@router.patch("/admin/settings/attendance")
def put_attendance_settings(body: dict[str, Any] = Body(default={})):
    cur = get_obj("attendance_settings") or {}
    cur.update(body)
    set_obj("attendance_settings", cur)
    _append_audit("Settings saved", "Attendance policy", "Settings")
    return cur


@router.get("/admin/settings/leave-accrual")
def get_leave_accrual():
    return get_obj("leave_accrual_policy") or {}


@router.put("/admin/settings/leave-accrual")
@router.patch("/admin/settings/leave-accrual")
def put_leave_accrual(body: dict[str, Any] = Body(default={})):
    cur = get_obj("leave_accrual_policy") or {}
    cur.update(body)
    set_obj("leave_accrual_policy", cur)
    _append_audit("Settings saved", "Leave accrual policy", "Settings")
    return cur


@router.get("/admin/offices")
@router.get("/organization/locations")
def list_offices():
    return get_collection("offices")


@router.get("/admin/offices/{office_id}")
def get_office(office_id: str):
    return next((o for o in get_collection("offices") if str(o.get("id")) == str(office_id)), None)


@router.post("/admin/offices")
def create_office(body: dict[str, Any] = Body(default={})):
    offices = get_collection("offices")
    oid = body.get("id") or f"off-{len(offices) + 1}"
    row = {**body, "id": oid}
    offices.append(row)
    set_collection("offices", offices)
    return row


@router.patch("/admin/offices/{office_id}")
def update_office(office_id: str, body: dict[str, Any] = Body(default={})):
    offices = get_collection("offices")
    o = next((x for x in offices if str(x.get("id")) == str(office_id)), None)
    if not o:
        return {"detail": "not found"}
    o.update(body)
    set_collection("offices", offices)
    return o


@router.get("/organization/departments")
@router.get("/admin/departments")
def list_departments():
    return get_collection("departments")


@router.get("/employment/positions")
@router.get("/admin/positions")
def list_positions():
    return get_collection("positions")


@router.get("/admin/_store/{collection}")
def dump_collection(collection: str):
    db = load()
    return db.get(collection)


@router.post("/admin/_reset")
def reset_store():
    from seed import main as seed_main
    seed_main()
    return {"ok": True, "message": "store re-seeded"}
