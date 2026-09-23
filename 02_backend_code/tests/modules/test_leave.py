"""Phase 4: leave types master, policies, requests, ledger."""
from __future__ import annotations

from sqlalchemy import select

from app.modules.leave.models import LeaveRequest
from tests.modules.helpers import db_scalar, grant, record_coverage, table_count

COVERED = [
    ("POST", "/api/v1/leave/types"),
    ("GET", "/api/v1/leave/types"),
    ("GET", "/api/v1/leave/types/{type_id}"),
    ("PATCH", "/api/v1/leave/types/{type_id}"),
    ("POST", "/api/v1/leave/types/{type_id}/soft-delete"),
    ("POST", "/api/v1/leave/policies"),
    ("GET", "/api/v1/leave/policies"),
    ("GET", "/api/v1/leave/policies/current/{leave_type}"),
    ("POST", "/api/v1/leave/requests"),
    ("GET", "/api/v1/leave/requests"),
    ("GET", "/api/v1/leave/requests/{request_id}"),
    ("POST", "/api/v1/leave/requests/{request_id}/cancel"),
    ("POST", "/api/v1/leave/ledger"),
    ("GET", "/api/v1/leave/ledger/{employment_id}"),
    ("GET", "/api/v1/leave/balances/{employment_id}"),
    ("GET", "/api/v1/leave/apply-context/{employment_id}"),
    ("POST", "/api/v1/leave/calculate"),
]


def _sa(factory):
    return factory.super_admin()


def test_leave_type_lifecycle(client, factory):
    h = _sa(factory)["headers"]
    before = table_count(client, "leave_types")
    created = client.post(
        "/api/v1/leave/types",
        json={
            "code": "STUDY",
            "name": "Study",
            "description": "Exam study leave",
            "is_paid": True,
            "requires_document": True,
            "default_annual_entitlement": "5.00",
            "sort_order": 50,
        },
        headers=h,
    )
    assert created.status_code == 201, created.text
    assert created.json()["code"] == "STUDY"
    assert created.json()["deleted_at"] is None
    assert table_count(client, "leave_types") == before + 1
    type_id = created.json()["id"]

    dup = client.post(
        "/api/v1/leave/types",
        json={"code": "study", "name": "Study dup"},
        headers=h,
    )
    assert dup.status_code == 409, dup.text

    listed = client.get("/api/v1/leave/types", headers=h)
    assert listed.status_code == 200
    assert any(r["code"] == "STUDY" for r in listed.json())

    got = client.get(f"/api/v1/leave/types/{type_id}", headers=h)
    assert got.status_code == 200
    assert got.json()["default_annual_entitlement"] in ("5.00", 5.0, 5)

    updated = client.patch(
        f"/api/v1/leave/types/{type_id}",
        json={"default_annual_entitlement": "6.00", "requires_document": False},
        headers=h,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["default_annual_entitlement"] in ("6.00", 6.0, 6)

    # Policy without explicit entitlement falls back to the type default.
    policy = client.post(
        "/api/v1/leave/policies",
        json={
            "name": "Study 2026",
            "leave_type": "STUDY",
            "effective_from": "2026-01-01",
        },
        headers=h,
    )
    assert policy.status_code == 201, policy.text
    assert policy.json()["leave_type"] == "STUDY"
    assert policy.json()["leave_type_id"] == type_id
    assert policy.json()["annual_entitlement"] in ("6.00", 6.0, 6)

    # Referenced types cannot be soft-deleted.
    blocked = client.post(f"/api/v1/leave/types/{type_id}/soft-delete", headers=h)
    assert blocked.status_code == 409, blocked.text

    doomed = client.post(
        "/api/v1/leave/types",
        json={"code": "DOOMED", "name": "Doomed"},
        headers=h,
    )
    assert doomed.status_code == 201, doomed.text
    doomed_id = doomed.json()["id"]
    deleted = client.post(
        f"/api/v1/leave/types/{doomed_id}/soft-delete", headers=h
    )
    assert deleted.status_code == 200, deleted.text
    assert deleted.json()["deleted_at"] is not None
    assert deleted.json()["is_active"] is False

    listed2 = client.get("/api/v1/leave/types", headers=h)
    codes = [r["code"] for r in listed2.json()]
    assert "STUDY" in codes and "DOOMED" not in codes
    listed_all = client.get(
        "/api/v1/leave/types", params={"include_archived": True}, headers=h
    )
    assert any(r["code"] == "DOOMED" for r in listed_all.json())

    # Unknown codes are rejected on policy create.
    bad = client.post(
        "/api/v1/leave/policies",
        json={
            "name": "Nope",
            "leave_type": "NOPE",
            "annual_entitlement": "1.00",
            "effective_from": "2026-01-01",
        },
        headers=h,
    )
    assert bad.status_code == 404, bad.text
    record_coverage("test_leave_type_lifecycle", COVERED[:5])


def test_policy_lifecycle(client, factory):
    h = _sa(factory)["headers"]
    before = table_count(client, "leave_policies")
    created = client.post(
        "/api/v1/leave/policies",
        json={
            "name": "Casual 2026",
            "leave_type": "CASUAL",
            "annual_entitlement": "12.00",
            "effective_from": "2026-01-01",
        },
        headers=h,
    )
    assert created.status_code == 201, created.text
    assert table_count(client, "leave_policies") == before + 1

    listed = client.get("/api/v1/leave/policies", headers=h)
    assert listed.status_code == 200
    assert any(r["leave_type"] == "CASUAL" for r in listed.json())

    current = client.get("/api/v1/leave/policies/current/CASUAL", headers=h)
    assert current.status_code == 200, current.text
    assert current.json()["leave_type"] == "CASUAL"
    record_coverage("test_policy_lifecycle", COVERED[5:8])


def test_request_lifecycle_with_cancel(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("lvr")
    emp_id = actor["employment_id"]
    grant(client, h, emp_id, "leave_request", "CREATE", "SELF", "Leave Filer")
    grant(client, h, emp_id, "leave_request", "VIEW", "SELF", "Leave Viewer")

    before = table_count(client, "leave_requests")
    created = client.post(
        "/api/v1/leave/requests",
        json={
            "employment_id": emp_id,
            "leave_type": "LOSS_OF_PAY",
            # Mon/Tue: canonical working-day count rejects weekend-only ranges
            "start_date": "2030-04-08",
            "end_date": "2030-04-09",
            "reason": "family trip",
        },
        headers=actor["headers"],
    )
    assert created.status_code == 201, created.text
    req_id = created.json()["id"]
    assert table_count(client, "leave_requests") == before + 1
    assert created.json()["approval_request_id"] is not None

    listed = client.get(
        "/api/v1/leave/requests",
        params={"employment_id": emp_id},
        headers=h,
    )
    assert listed.status_code == 200
    assert any(r["id"] == req_id for r in listed.json())

    got = client.get(f"/api/v1/leave/requests/{req_id}", headers=actor["headers"])
    assert got.status_code == 200

    cancelled = client.post(
        f"/api/v1/leave/requests/{req_id}/cancel", headers=actor["headers"]
    )
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["status"] == "CANCELLED"
    assert (
        db_scalar(
            client, select(LeaveRequest.status).where(LeaveRequest.id == req_id)
        ).value
        == "CANCELLED"
    )
    record_coverage("test_request_lifecycle_with_cancel", COVERED[8:12])


def test_ledger_balances_context_calculate(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("ldg")
    emp_id = actor["employment_id"]
    grant(client, h, emp_id, "leave_request", "VIEW", "SELF", "Leave Self View")

    posted = client.post(
        "/api/v1/leave/ledger",
        json={
            "employment_id": emp_id,
            "leave_type": "CASUAL",
            "transaction_type": "ENTITLEMENT",
            "days": "12.00",
        },
        headers=h,
    )
    assert posted.status_code == 201, posted.text
    assert (
        table_count(client, "leave_ledger") >= 1
    )

    rows = client.get(f"/api/v1/leave/ledger/{emp_id}", headers=actor["headers"])
    assert rows.status_code == 200, rows.text
    assert any(r["transaction_type"] == "ENTITLEMENT" for r in rows.json())

    balances = client.get(f"/api/v1/leave/balances/{emp_id}", headers=actor["headers"])
    assert balances.status_code == 200, balances.text
    by_type = {b["leave_type"]: b["balance_days"] for b in balances.json()["balances"]}
    assert float(by_type.get("CASUAL", 0)) >= 12.0

    ctx = client.get(
        f"/api/v1/leave/apply-context/{emp_id}",
        params={"year": 2030},
        headers=actor["headers"],
    )
    assert ctx.status_code == 200, ctx.text
    assert ctx.json()["employment_id"] == emp_id

    calc = client.post(
        "/api/v1/leave/calculate",
        json={
            "employment_id": emp_id,
            "leave_type": "CASUAL",
            "start_date": "2030-05-06",
            "end_date": "2030-05-07",
        },
        headers=h,
    )
    assert calc.status_code == 200, calc.text
    assert float(calc.json()["day_cost"]) >= 1.0
    record_coverage("test_ledger_balances_context_calculate", COVERED[12:])
