"""Phase 4: RBAC catalog, roles, grants, effective permissions."""
from __future__ import annotations

from sqlalchemy import select as _select

from app.modules.rbac.models import Role as _Role
from tests.modules.helpers import db_scalar, record_coverage, table_count

COVERED = [
    ("GET", "/api/v1/rbac/resources"),
    ("GET", "/api/v1/rbac/permissions"),
    ("GET", "/api/v1/rbac/scopes"),
    ("GET", "/api/v1/rbac/sensitive-fields"),
    ("POST", "/api/v1/rbac/roles"),
    ("GET", "/api/v1/rbac/roles"),
    ("GET", "/api/v1/rbac/roles/{role_id}"),
    ("PATCH", "/api/v1/rbac/roles/{role_id}"),
    ("DELETE", "/api/v1/rbac/roles/{role_id}"),
    ("POST", "/api/v1/rbac/roles/{role_id}/permissions"),
    ("DELETE", "/api/v1/rbac/roles/{role_id}/permissions/{permission_id}/scopes/{scope_id}"),
    ("POST", "/api/v1/rbac/employments/{employment_id}/roles"),
    ("DELETE", "/api/v1/rbac/employments/{employment_id}/roles/{role_id}"),
    ("GET", "/api/v1/rbac/employments/{employment_id}/roles"),
    ("GET", "/api/v1/rbac/employments/{employment_id}/effective-permissions"),
    ("PUT", "/api/v1/rbac/roles/{role_id}/sensitive-fields"),
]


def _sa(factory):
    return factory.super_admin()


def test_rbac_catalog_reads(client, factory):
    h = _sa(factory)["headers"]
    res = client.get("/api/v1/rbac/resources", headers=h)
    assert res.status_code == 200
    assert len(res.json()) >= 22
    perms = client.get("/api/v1/rbac/permissions", headers=h)
    assert perms.status_code == 200
    assert len(perms.json()) >= 100
    scopes = client.get("/api/v1/rbac/scopes", headers=h)
    assert scopes.status_code == 200
    assert {s["name"] for s in scopes.json()} >= {"SELF", "ORGANIZATION"}
    fields = client.get("/api/v1/rbac/sensitive-fields", headers=h)
    assert fields.status_code == 200
    assert any(f["field_key"] == "gross_salary" for f in fields.json())
    record_coverage("test_rbac_catalog_reads", COVERED[:4])


def test_role_lifecycle_with_grants(client, factory):
    h = _sa(factory)["headers"]
    actor = factory.actor("rbu")
    before = table_count(client, "roles")
    created = client.post(
        "/api/v1/rbac/roles",
        json={"name": "Duty Manager", "description": "shift lead"},
        headers=h,
    )
    assert created.status_code == 201, created.text
    role_id = created.json()["id"]
    assert table_count(client, "roles") == before + 1

    listed = client.get("/api/v1/rbac/roles", headers=h)
    assert listed.status_code == 200
    assert any(r["id"] == role_id for r in listed.json()["items"])

    got = client.get(f"/api/v1/rbac/roles/{role_id}", headers=h)
    assert got.status_code == 200

    updated = client.patch(
        f"/api/v1/rbac/roles/{role_id}",
        json={"description": "shift lead v2"},
        headers=h,
    )
    assert updated.status_code == 200, updated.text

    resources = {r["name"]: r["id"] for r in client.get("/api/v1/rbac/resources", headers=h).json()}
    perms = client.get("/api/v1/rbac/permissions", headers=h).json()
    scopes = {s["name"]: s["id"] for s in client.get("/api/v1/rbac/scopes", headers=h).json()}
    perm = next(
        p for p in perms if p["resource_id"] == resources["attendance"] and p["action"] == "VIEW"
    )
    granted = client.post(
        f"/api/v1/rbac/roles/{role_id}/permissions",
        json={"permission_id": perm["id"], "scope_id": scopes["SELF"]},
        headers=h,
    )
    assert granted.status_code == 201, granted.text

    assigned = client.post(
        f"/api/v1/rbac/employments/{actor['employment_id']}/roles",
        json={"role_id": role_id},
        headers=h,
    )
    assert assigned.status_code == 201, assigned.text

    emp_roles = client.get(
        f"/api/v1/rbac/employments/{actor['employment_id']}/roles", headers=h
    )
    assert emp_roles.status_code == 200
    assert any(r["role_id"] == role_id for r in emp_roles.json())

    effective = client.get(
        f"/api/v1/rbac/employments/{actor['employment_id']}/effective-permissions",
        headers=h,
    )
    assert effective.status_code == 200, effective.text
    body = effective.json()
    assert body["scopeByResource"]["attendance"] == "SELF"

    fields = client.get("/api/v1/rbac/sensitive-fields", headers=h).json()
    field = next(f for f in fields if f["field_key"] == "gross_salary")
    set_fp = client.put(
        f"/api/v1/rbac/roles/{role_id}/sensitive-fields",
        json={"sensitive_field_id": field["id"], "can_read": True, "can_update": False},
        headers=h,
    )
    assert set_fp.status_code == 200, set_fp.text

    unassigned = client.delete(
        f"/api/v1/rbac/employments/{actor['employment_id']}/roles/{role_id}",
        headers=h,
    )
    assert unassigned.status_code == 200, unassigned.text

    revoked = client.delete(
        f"/api/v1/rbac/roles/{role_id}/permissions/{perm['id']}/scopes/{scopes['SELF']}",
        headers=h,
    )
    assert revoked.status_code == 200, revoked.text

    deleted = client.delete(f"/api/v1/rbac/roles/{role_id}", headers=h)
    assert deleted.status_code == 200, deleted.text
    # Soft-delete: row remains with is_archived=true, excluded from lists
    assert db_scalar(client, _select(_Role.is_archived).where(_Role.id == role_id)) is True
    relisted = client.get("/api/v1/rbac/roles", headers=h).json()
    assert all(r["id"] != role_id for r in relisted["items"])
    assert client.get(f"/api/v1/rbac/roles/{role_id}", headers=h).status_code == 404
    record_coverage("test_role_lifecycle_with_grants", COVERED[4:])
