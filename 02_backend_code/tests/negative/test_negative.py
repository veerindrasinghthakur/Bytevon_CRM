"""Phase 6 negative/security regression.

Validation, conflicts, state transitions, boundaries, 404s, error format,
authz abuse, and token specials.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from jose import jwt

from app.core.config import settings
from tests.modules.helpers import grant


def _sa(factory):
    return factory.super_admin()


def _err_shape(resp):
    body = resp.json()
    assert "error" in body, body
    assert "code" in body["error"] and "message" in body["error"], body
    return body["error"]["code"]


def test_validation_errors_and_format(client, factory):
    h = _sa(factory)["headers"]
    bad_person = client.post(
        "/api/v1/workforce/persons", json={"first_name": "", "last_name": "X"}, headers=h
    )
    assert bad_person.status_code == 422
    assert _err_shape(bad_person) == "validation_error"

    bad_leave = client.post(
        "/api/v1/leave/requests",
        json={
            "employment_id": 1,
            "leave_type": "NOPE",
            "start_date": "2030-01-01",
            "end_date": "2030-01-02",
        },
        headers=h,
    )
    assert bad_leave.status_code == 422

    bad_dates = client.post(
        "/api/v1/leave/requests",
        json={
            "employment_id": 1,
            "leave_type": "CASUAL",
            "start_date": "2030-01-05",
            "end_date": "2030-01-01",
        },
        headers=h,
    )
    assert bad_dates.status_code == 422


def test_conflicts(client, factory):
    h = _sa(factory)["headers"]
    first = client.post("/api/v1/workforce/departments", json={"name": "Dup"}, headers=h)
    assert first.status_code == 201, first.text
    dup = client.post("/api/v1/workforce/departments", json={"name": "Dup"}, headers=h)
    assert dup.status_code == 409
    assert _err_shape(dup) == "conflict"

    me = factory.actor("neg")
    emp = client.post(
        "/api/v1/workforce/employments",
        json={
            "person_id": me["person_id"],
            "employee_code": "EMP-DUP-1",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-01-01",
        },
        headers=h,
    )
    assert emp.status_code == 201, emp.text
    emp2 = client.post(
        "/api/v1/workforce/employments",
        json={
            "person_id": me["person_id"],
            "employee_code": "EMP-DUP-1",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-01-01",
        },
        headers=h,
    )
    assert emp2.status_code == 409

    role = client.post("/api/v1/rbac/roles", json={"name": "DupRole"}, headers=h)
    assert role.status_code == 201, role.text
    role2 = client.post("/api/v1/rbac/roles", json={"name": "DupRole"}, headers=h)
    assert role2.status_code == 409

    grant(client, h, me["employment_id"], "leave_request", "CREATE", "SELF", "Neg Leave")
    leave1 = client.post(
        "/api/v1/leave/requests",
        json={
            "employment_id": me["employment_id"],
            "leave_type": "LOSS_OF_PAY",
            "start_date": "2030-09-01",
            "end_date": "2030-09-02",
        },
        headers=me["headers"],
    )
    assert leave1.status_code == 201, leave1.text
    leave2 = client.post(
        "/api/v1/leave/requests",
        json={
            "employment_id": me["employment_id"],
            "leave_type": "LOSS_OF_PAY",
            "start_date": "2030-09-02",
            "end_date": "2030-09-03",
        },
        headers=me["headers"],
    )
    assert leave2.status_code == 409


def test_state_transition_guards(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    req = factory.actor("neg2")
    appr = factory.actor("neg3")
    grant(client, h, appr["employment_id"], "approval", "APPROVE", "DEPARTMENT", "Neg Appr")
    leave = factory.leave_for(req, start_date="2030-10-06", end_date="2030-10-06")
    aid = leave["approval_id"]
    ok = client.post(
        f"/api/v1/approvals/requests/{aid}/approve",
        json={"remarks": "yes"},
        headers=appr["headers"],
    )
    assert ok.status_code == 200, ok.text
    # Second decision on non-pending request is rejected.
    again = client.post(
        f"/api/v1/approvals/requests/{aid}/reject",
        json={"remarks": "no"},
        headers=appr["headers"],
    )
    assert again.status_code == 400
    # Cancelling an approved leave request is rejected.
    cancel = client.post(
        f"/api/v1/leave/requests/{leave['leave_id']}/cancel", headers=h
    )
    assert cancel.status_code in (400, 403, 404)


def test_boundaries_and_404s(client, factory):
    h = _sa(factory)["headers"]
    for path in (
        "/api/v1/workforce/employments/999999",
        "/api/v1/leave/requests/999999",
        "/api/v1/approvals/requests/999999",
        "/api/v1/workforce/attendance/days/999999",
        "/api/v1/payroll/999999",
        "/api/v1/projects/tasks/999999",
        "/api/v1/admin/departments/999999",
        "/api/v1/sales/leads/999999",
    ):
        resp = client.get(path, headers=h)
        assert resp.status_code == 404, (path, resp.status_code)
        assert _err_shape(resp) == "not_found"

    big_page = client.get(
        "/api/v1/workforce/employments", params={"limit": 100000}, headers=h
    )
    assert big_page.status_code in (200, 422)

    bad_enum = client.post(
        "/api/v1/sales/leads/1/status", json={"status": "BOGUS"}, headers=h
    )
    assert bad_enum.status_code in (404, 422)


def test_authz_abuse_without_grants(client, factory):
    me = factory.actor("neg4")
    ah = me["headers"]
    # Grant-less writes across modules are hidden (404) or rejected (401).
    assert (
        client.post(
            "/api/v1/workforce/departments", json={"name": "Nope"}, headers=ah
        ).status_code
        in (401, 403, 404)
    )
    assert (
        client.post(
            "/api/v1/payroll/salaries",
            json={
                "employment_id": me["employment_id"],
                "effective_from": "2026-01-01",
                "gross_salary": "1.00",
                "items": [],
            },
            headers=ah,
        ).status_code
        in (401, 403, 404)
    )
    assert (
        client.post(
            "/api/v1/admin/users",
            json={
                "employmentId": me["employment_id"],
                "email": "x@y.example",
                "temporaryPassword": "TempPass123!",
            },
            headers=ah,
        ).status_code
        in (401, 403, 404)
    )


def _craft_token(**claims) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(claims.get("login_id", 1)),
        "login_id": claims.get("login_id", 1),
        "person_id": claims.get("person_id", 1),
        "employment_id": claims.get("employment_id"),
        "type": claims.get("type", "access"),
        "jti": str(uuid4()),
        "iat": now - timedelta(minutes=60),
        "exp": now - timedelta(minutes=5),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def test_token_specials(client, factory):
    me = factory.actor("neg5")
    expired = _craft_token(
        login_id=me["login_id"], person_id=me["person_id"],
        employment_id=me["employment_id"],
    )
    resp = client.get(
        "/api/v1/workforce/employments",
        headers={"Authorization": f"Bearer {expired}"},
    )
    assert resp.status_code == 401

    malformed = client.get(
        "/api/v1/workforce/employments",
        headers={"Authorization": "Bearer definitely-not-a-token"},
    )
    assert malformed.status_code == 401

    wrong_type = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": me["headers"]["Authorization"].split()[1]}
    )
    # Access token presented as refresh token must be rejected.
    assert wrong_type.status_code == 401

    # Token whose employment does not belong to the person is rejected.
    other = factory.actor("neg6")
    forged = factory.synthetic_headers(
        login_id=me["login_id"],
        person_id=me["person_id"],
        employment_id=other["employment_id"],
    )
    resp2 = client.get("/api/v1/my-work/leave/balances", headers=forged)
    assert resp2.status_code in (401, 403, 404)
