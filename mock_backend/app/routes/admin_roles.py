"""Admin roles + RBAC catalogue."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.services import store

router = APIRouter(tags=["admin-roles"])


def _to_admin_role(r: dict) -> dict:
    return {
        "id": r.get("code") or f"R-{r.get('id')}",
        "numericId": r.get("id"),
        "name": r.get("name"),
        "description": r.get("description") or "",
        "usersCount": r.get("users_count", 0),
        "permissions": r.get("permissions") or [],
        "status": r.get("status") or "Active",
        "category": r.get("category") or "Standard",
        "coveragePct": r.get("coverage_pct", 0),
        "coverageLabel": r.get("coverage_label") or "0 modules",
        "created": r.get("created") or "",
        "updated": r.get("updated") or "",
    }


@router.get("/rbac/permission-catalog")
@router.get("/admin/rbac/permission-catalog")
def permission_catalog():
    return store.read_obj("permission_catalog.json")


@router.get("/rbac/roles")
@router.get("/admin/roles")
def list_roles():
    roles = store.read_list("roles.json")
    return [_to_admin_role(r) for r in roles]


@router.get("/rbac/roles/{role_id}")
@router.get("/admin/roles/{role_id}")
def get_role(role_id: str):
    roles = store.read_list("roles.json")
    role = next(
        (r for r in roles if str(r.get("id")) == str(role_id) or r.get("code") == role_id),
        None,
    )
    if not role:
        raise HTTPException(404, "Role not found")
    return _to_admin_role(role)


@router.post("/rbac/roles")
@router.post("/admin/roles")
def create_role(body: dict):
    roles = store.read_list("roles.json")
    rid = store.next_id("next_role_id")
    code = f"R-{rid:02d}"
    now = datetime.utcnow().strftime("%b %d, %Y")
    row = {
        "id": rid,
        "code": code,
        "name": body.get("name") or f"Role {rid}",
        "description": body.get("description") or "",
        "users_count": 0,
        "permissions": body.get("permissions") or [],
        "status": body.get("status") or "Active",
        "category": body.get("category") or "Standard",
        "coverage_pct": body.get("coveragePct") or body.get("coverage_pct") or 0,
        "coverage_label": body.get("coverageLabel") or body.get("coverage_label") or "0 modules",
        "created": now,
        "updated": "just now",
    }
    roles.append(row)
    store.write("roles.json", roles)
    return _to_admin_role(row)


@router.patch("/rbac/roles/{role_id}")
@router.patch("/admin/roles/{role_id}")
def update_role(role_id: str, body: dict):
    roles = store.read_list("roles.json")
    idx = next(
        (i for i, r in enumerate(roles) if str(r.get("id")) == str(role_id) or r.get("code") == role_id),
        None,
    )
    if idx is None:
        raise HTTPException(404, "Role not found")
    role = roles[idx]
    for src, dest in [
        ("name", "name"),
        ("description", "description"),
        ("status", "status"),
        ("permissions", "permissions"),
        ("category", "category"),
        ("coveragePct", "coverage_pct"),
        ("coverage_pct", "coverage_pct"),
        ("coverageLabel", "coverage_label"),
        ("coverage_label", "coverage_label"),
    ]:
        if src in body:
            role[dest] = body[src]
    role["updated"] = "just now"
    roles[idx] = role
    store.write("roles.json", roles)
    return _to_admin_role(role)


@router.delete("/rbac/roles/{role_id}")
@router.delete("/admin/roles/{role_id}")
def delete_role(role_id: str):
    roles = store.read_list("roles.json")
    new_roles = [r for r in roles if str(r.get("id")) != str(role_id) and r.get("code") != role_id]
    if len(new_roles) == len(roles):
        raise HTTPException(404, "Role not found")
    store.write("roles.json", new_roles)
    return {"ok": True, "deleted": role_id}
