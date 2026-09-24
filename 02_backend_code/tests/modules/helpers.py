"""Shared helpers for Phase 4 module tests: DB verification + coverage ledger."""
from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import text

from app.core.database import AsyncSessionLocal

_LEDGER_PATH = (
    Path(__file__).resolve().parent.parent
    / "coverage"
    / "endpoint_coverage.json"
)


def db_scalar(client, stmt):
    async def _run():
        async with AsyncSessionLocal() as session:
            return (await session.execute(stmt)).scalar_one_or_none()

    return client.portal.call(_run)


def db_all(client, stmt):
    async def _run():
        async with AsyncSessionLocal() as session:
            return (await session.execute(stmt)).all()

    return client.portal.call(_run)


def table_count(client, table: str) -> int:
    async def _run():
        async with AsyncSessionLocal() as session:
            return (
                await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
            ).scalar_one()

    return client.portal.call(_run)


def grant(client, sa_headers: dict, employment_id: int, resource: str,
          action: str, scope: str, role_name: str) -> int:
    """Grant (resource, action, scope) to an employment via a dedicated role."""
    r = client.get(
        "/api/v1/rbac/roles", params={"search": role_name}, headers=sa_headers
    )
    assert r.status_code == 200, r.text
    items = r.json().get("items", [])
    role = next((x for x in items if x["name"] == role_name), None)
    if role is None:
        r = client.post(
            "/api/v1/rbac/roles",
            json={"name": role_name, "description": "module test role"},
            headers=sa_headers,
        )
        assert r.status_code in (200, 201), r.text
        role = r.json()
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
        f"/api/v1/rbac/roles/{role['id']}/permissions",
        json={"permission_id": perm["id"], "scope_id": scopes[scope]},
        headers=sa_headers,
    )
    assert g.status_code in (200, 201, 409), g.text
    a = client.post(
        f"/api/v1/rbac/employments/{employment_id}/roles",
        json={"role_id": role["id"]},
        headers=sa_headers,
    )
    assert a.status_code in (200, 201, 409), a.text
    return role["id"]


def record_coverage(test_id: str, endpoints: list[tuple[str, str]]) -> None:
    """Append endpoint coverage ledger entries (Phase 7 denominator check)."""
    _LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        ledger = json.loads(_LEDGER_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        ledger = {}
    for method, path in endpoints:
        ledger.setdefault(f"{method} {path}", []).append(test_id)
        # de-dupe preserving order
        seen, ordered = set(), []
        for t in ledger[f"{method} {path}"]:
            if t not in seen:
                seen.add(t)
                ordered.append(t)
        ledger[f"{method} {path}"] = ordered
    _LEDGER_PATH.write_text(json.dumps(ledger, indent=1), encoding="utf-8")
