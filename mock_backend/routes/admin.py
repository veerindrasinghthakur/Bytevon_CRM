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


@router.get("/rbac/roles")
@router.get("/admin/roles")
def list_roles():
    return get_collection("roles")


@router.get("/rbac/roles/{role_id}")
@router.get("/admin/roles/{role_id}")
def get_role(role_id: str):
    return next((x for x in get_collection("roles") if str(x.get("id")) == str(role_id)), {"detail": "not found"})


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
    return r


@router.delete("/rbac/roles/{role_id}")
@router.delete("/admin/roles/{role_id}")
def delete_role(role_id: str):
    roles = get_collection("roles")
    set_collection("roles", [x for x in roles if str(x.get("id")) != str(role_id)])
    return {"ok": True}


@router.get("/admin/users")
def list_users(search: Optional[str] = None, status: Optional[str] = None):
    items = list(get_collection("admin_users"))
    if search:
        q = search.lower()
        items = [u for u in items if q in (u.get("name") or "").lower() or q in (u.get("email") or "").lower()]
    if status:
        items = [u for u in items if (u.get("status") or "").lower() == status.lower()]
    return {
        "items": items,
        "total": len(items),
        "locked": sum(1 for u in items if u.get("status") == "Locked"),
        "active": sum(1 for u in items if u.get("status") == "Active"),
    }


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


@router.get("/admin/settings/leave-accrual")
def get_leave_accrual():
    return get_obj("leave_accrual_policy") or {}


@router.patch("/admin/settings/leave-accrual")
@router.put("/admin/settings/leave-accrual")
def put_leave_accrual(body: dict[str, Any] = Body(default={})):
    cur = get_obj("leave_accrual_policy") or {}
    cur.update(body)
    set_obj("leave_accrual_policy", cur)
    return cur


@router.get("/admin/settings/attendance")
def get_attendance_settings():
    return get_obj("attendance_settings") or {}


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


@router.post("/admin/_reset")
def reset_store():
    from seed import main as seed_main
    seed_main()
    return {"ok": True}
