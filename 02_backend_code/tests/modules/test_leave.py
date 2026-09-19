"""Phase 4: leave policies, requests, ledger."""
from __future__ import annotations

from sqlalchemy import select

from app.modules.leave.models import LeaveRequest
from tests.modules.helpers import db_scalar, grant, record_coverage, table_count

COVERED = [
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
    record_coverage("test_policy_lifecycle", COVERED[:3])


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
            "start_date": "2030-04-06",
            "end_date": "2030-04-07",
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
    record_coverage("test_request_lifecycle_with_cancel", COVERED[3:7])


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
    record_coverage("test_ledger_balances_context_calculate", COVERED[7:])
