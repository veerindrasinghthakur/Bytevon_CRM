"""Phase 3 permanent regression: grants, scopes, header identity, contracts.

Covers: SELF grant gating, DEPARTMENT approval authority, ORGANIZATION
admin gating, Super Admin bypass limits, X-Employment-Id validation,
and cross-login action denial.
"""
from __future__ import annotations

import pytest
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.db.enums import Action
from app.modules.rbac.models import (
    EmployeeRole,
    Permission,
    Resource,
    Role,
    RolePermission,
    Scope,
)


@pytest.fixture
def actors(factory):
    a = factory.actor("sc-a")
    b = factory.actor("sc-b")
    return {"A": a, "B": b, "SA": factory.super_admin()}


async def _grant(session, role_name, resource, action, scope):
    role = (
        await session.execute(select(Role).where(Role.name == role_name))
    ).scalar_one_or_none()
    if role is None:
        role = Role(name=role_name, description="phase3", changed_by=1)
        session.add(role)
        await session.flush()
    res = (
        await session.execute(select(Resource).where(Resource.name == resource))
    ).scalar_one()
    perm = (
        await session.execute(
            select(Permission).where(
                Permission.resource_id == res.id,
                Permission.action == Action[action],
            )
        )
    ).scalar_one()
    scope_row = (
        await session.execute(select(Scope).where(Scope.name == scope))
    ).scalar_one()
    existing = (
        await session.execute(
            select(RolePermission).where(
                RolePermission.role_id == role.id,
                RolePermission.permission_id == perm.id,
                RolePermission.scope_id == scope_row.id,
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        session.add(
            RolePermission(
                role_id=role.id,
                permission_id=perm.id,
                scope_id=scope_row.id,
                changed_by=1,
            )
        )
        await session.flush()
    await session.commit()
    return role.id


async def _assign(session, employment_id, role_id):
    existing = (
        await session.execute(
            select(EmployeeRole).where(
                EmployeeRole.employment_id == employment_id,
                EmployeeRole.role_id == role_id,
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        session.add(
            EmployeeRole(employment_id=employment_id, role_id=role_id, changed_by=1)
        )
        await session.commit()


def _setup_grant(client, role_name, employment_id, resource, action, scope):
    async def _run():
        async with AsyncSessionLocal() as session:
            rid = await _grant(session, role_name, resource, action, scope)
            await _assign(session, employment_id, rid)

    client.portal.call(_run)


def test_self_grant_gates_self_views(client, actors):
    # No grant: grant-less owner is denied on grant-gated SELF views...
    denied = client.get("/api/v1/my-work/leave/balances", headers=actors["A"]["headers"])
    assert denied.status_code in (401, 403, 404)
    # ...and allowed once the SELF grant exists.
    _setup_grant(
        client, "Self Leave", actors["A"]["employment_id"],
        "leave_request", "VIEW", "SELF",
    )
    allowed = client.get(
        "/api/v1/my-work/leave/balances", headers=actors["A"]["headers"]
    )
    assert allowed.status_code == 200, allowed.text


def test_department_approver_can_decide_and_requester_cannot_self_approve(
    client, factory, actors
):
    leave = factory.leave_for(actors["B"])
    approval_id = leave["approval_id"]
    _setup_grant(
        client, "Dept Approver", actors["A"]["employment_id"],
        "approval", "APPROVE", "DEPARTMENT",
    )
    # Approver with DEPARTMENT grant approves B's request.
    resp = client.post(
        f"/api/v1/approvals/requests/{approval_id}/approve",
        json={"remarks": "looks good"},
        headers=actors["A"]["headers"],
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "APPROVED"
    # Requester approving own request violates business rules (400), not auth.
    leave2 = factory.leave_for(
        actors["B"], start_date="2030-02-09", end_date="2030-02-09"
    )
    _setup_grant(
        client, "Dept Approver", actors["B"]["employment_id"],
        "approval", "APPROVE", "DEPARTMENT",
    )
    own = client.post(
        f"/api/v1/approvals/requests/{leave2['approval_id']}/approve",
        json={"remarks": "self"},
        headers=actors["B"]["headers"],
    )
    assert own.status_code == 400, own.text


def test_organization_admin_endpoints_need_grant(client, actors):
    denied = client.get("/api/v1/admin/users", headers=actors["A"]["headers"])
    assert denied.status_code in (401, 403, 404)
    _setup_grant(
        client, "User Admin", actors["A"]["employment_id"], "user", "VIEW", "ORGANIZATION"
    )
    allowed = client.get("/api/v1/admin/users", headers=actors["A"]["headers"])
    assert allowed.status_code == 200, allowed.text


def test_super_admin_bypass_with_and_without_grants(client, actors):
    # No grants needed for admin reads...
    resp = client.get("/api/v1/admin/users", headers=actors["SA"]["headers"])
    assert resp.status_code == 200, resp.text
    # ...but authentication is never bypassed.
    assert client.get("/api/v1/admin/users").status_code == 401


def test_foreign_employment_header_override_rejected(client, actors):
    mixed = {
        "Authorization": actors["A"]["headers"]["Authorization"],
        "X-Employment-Id": str(actors["B"]["employment_id"]),
    }
    resp = client.get("/api/v1/my-work/leave/balances", headers=mixed)
    assert resp.status_code in (401, 403, 404)


def test_header_only_identity_rejected(client, actors):
    spoofed = {"X-Employment-Id": str(actors["B"]["employment_id"])}
    assert (
        client.get("/api/v1/my-work/leave/balances", headers=spoofed).status_code
        == 401
    )
    assert (
        client.post(
            "/api/v1/workforce/attendance/punch",
            json={
                "employment_id": actors["B"]["employment_id"],
                "punch_type": "CHECK_IN",
            },
            headers=spoofed,
        ).status_code
        == 401
    )


def test_cross_login_session_actions_forbidden(client, actors):
    # A cannot log out / change password / list sessions for B's login.
    evil = {
        "Authorization": actors["A"]["headers"]["Authorization"],
        "X-Login-Id": str(actors["B"]["login_id"]),
    }
    assert (
        client.post("/api/v1/auth/logout", headers=evil).status_code == 403
    )
    assert (
        client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "x", "new_password": "Newpass456!"},
            headers=evil,
        ).status_code
        == 403
    )
    assert (
        client.get("/api/v1/auth/sessions", headers=evil).status_code == 403
    )
