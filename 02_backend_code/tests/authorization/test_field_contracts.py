"""Phase 3 permanent regression: Sensitive Field Contract (SEC-008).

- can_read=false  -> field OMITTED (absent, not null); nested follows parent.
- can_update=false -> write REJECTED (400) when the field is provided.
- Super Admin    -> implicit allow on all sensitive fields.
"""
from __future__ import annotations

import pytest


@pytest.fixture
def actors(factory):
    a = factory.actor("sf-a")
    b = factory.actor("sf-b")
    return {"A": a, "B": b, "SA": factory.super_admin()}


@pytest.fixture
def b_salary(factory, actors):
    return factory.salary_for(actors["B"])


def _role_id(client, sa_headers, role_name):
    r = client.get(
        "/api/v1/rbac/roles", params={"search": role_name}, headers=sa_headers
    )
    assert r.status_code == 200, r.text
    items = r.json().get("items", [])
    role = next((x for x in items if x["name"] == role_name), None)
    if role is None:
        r = client.post(
            "/api/v1/rbac/roles",
            json={"name": role_name, "description": "phase3 fields"},
            headers=sa_headers,
        )
        assert r.status_code in (200, 201), r.text
        role = r.json()
    return role["id"]


def _grant_api(client, sa_headers, role_id, resource, action, scope):
    perms = client.get("/api/v1/rbac/permissions", headers=sa_headers).json()
    res = next(
        x
        for x in client.get("/api/v1/rbac/resources", headers=sa_headers).json()
        if x["name"] == resource
    )
    perm = next(
        p for p in perms if p["resource_id"] == res["id"] and p["action"] == action
    )
    scopes = {
        s["name"]: s["id"]
        for s in client.get("/api/v1/rbac/scopes", headers=sa_headers).json()
    }
    g = client.post(
        f"/api/v1/rbac/roles/{role_id}/permissions",
        json={"permission_id": perm["id"], "scope_id": scopes[scope]},
        headers=sa_headers,
    )
    assert g.status_code in (200, 201, 409), g.text


def _assign_api(client, sa_headers, employment_id, role_id):
    r = client.post(
        f"/api/v1/rbac/employments/{employment_id}/roles",
        json={"role_id": role_id},
        headers=sa_headers,
    )
    assert r.status_code in (200, 201, 409), r.text


def _set_field(client, sa_headers, role_id, field_key, can_read, can_update):
    fields = client.get("/api/v1/rbac/sensitive-fields", headers=sa_headers).json()
    items = fields if isinstance(fields, list) else fields.get("items", [])
    field = next(f for f in items if f["field_key"] == field_key)
    r = client.put(
        f"/api/v1/rbac/roles/{role_id}/sensitive-fields",
        json={
            "sensitive_field_id": field["id"],
            "can_read": can_read,
            "can_update": can_update,
        },
        headers=sa_headers,
    )
    assert r.status_code in (200, 201), r.text


def test_restricted_reader_omits_sensitive_fields(client, actors, b_salary):
    sa_h = actors["SA"]["headers"]
    role_id = _role_id(client, sa_h, "Payroll Viewer")
    _grant_api(client, sa_h, role_id, "salary", "VIEW", "ORGANIZATION")
    _set_field(client, sa_h, role_id, "gross_salary", False, False)
    _assign_api(client, sa_h, actors["A"]["employment_id"], role_id)
    resp = client.get(
        f"/api/v1/payroll/salaries/{actors['B']['employment_id']}",
        headers=actors["A"]["headers"],
    )
    assert resp.status_code == 200, resp.text
    rows = resp.json()
    assert rows and "gross_salary" not in rows[0]
    assert "items" not in rows[0]


def test_full_reader_includes_sensitive_fields(client, actors, b_salary):
    sa_h = actors["SA"]["headers"]
    role_id = _role_id(client, sa_h, "Payroll Full")
    _grant_api(client, sa_h, role_id, "salary", "VIEW", "ORGANIZATION")
    _set_field(client, sa_h, role_id, "gross_salary", True, True)
    _assign_api(client, sa_h, actors["A"]["employment_id"], role_id)
    resp = client.get(
        f"/api/v1/payroll/salaries/{actors['B']['employment_id']}",
        headers=actors["A"]["headers"],
    )
    assert resp.status_code == 200, resp.text
    rows = resp.json()
    assert rows and "gross_salary" in rows[0]


def test_write_with_denied_field_rejected_400(client, actors, b_salary):
    sa_h = actors["SA"]["headers"]
    role_id = _role_id(client, sa_h, "Payroll Creator")
    _grant_api(client, sa_h, role_id, "salary", "CREATE", "ORGANIZATION")
    _set_field(client, sa_h, role_id, "gross_salary", False, False)
    _assign_api(client, sa_h, actors["A"]["employment_id"], role_id)
    denied = client.post(
        "/api/v1/payroll/salaries",
        json={
            "employment_id": actors["B"]["employment_id"],
            "effective_from": "2026-02-01",
            "gross_salary": "99999.00",
            "items": [],
        },
        headers=actors["A"]["headers"],
    )
    assert denied.status_code == 400, denied.text


def test_super_admin_implicit_field_allow(client, actors, b_salary):
    resp = client.get(
        f"/api/v1/payroll/salaries/{actors['B']['employment_id']}",
        headers=actors["SA"]["headers"],
    )
    assert resp.status_code == 200, resp.text
    rows = resp.json()
    assert rows and "gross_salary" in rows[0]
