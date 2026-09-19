"""Phase 4: approvals requests + actions."""
from __future__ import annotations

from tests.modules.helpers import grant, record_coverage, table_count

COVERED = [
    ("GET", "/api/v1/approvals/kpis"),
    ("GET", "/api/v1/approvals/pending"),
    ("GET", "/api/v1/approvals/my-requests"),
    ("GET", "/api/v1/approvals/approvers"),
    ("POST", "/api/v1/approvals/requests"),
    ("GET", "/api/v1/approvals/requests"),
    ("GET", "/api/v1/approvals/requests/{request_id}"),
    ("GET", "/api/v1/approvals/requests/by-reference/{request_type}/{reference_id}"),
    ("GET", "/api/v1/approvals/{request_id}"),
    ("POST", "/api/v1/approvals/{request_id}/approve"),
    ("POST", "/api/v1/approvals/{request_id}/reject"),
    ("POST", "/api/v1/approvals/requests/{request_id}/approve"),
    ("POST", "/api/v1/approvals/requests/{request_id}/reject"),
    ("POST", "/api/v1/approvals/requests/{request_id}/cancel"),
    ("POST", "/api/v1/approvals/requests/{request_id}/comment"),
]


def _sa(factory):
    return factory.super_admin()


def _setup(factory, client):
    sa = _sa(factory)
    req = factory.actor("apr")
    appr = factory.actor("apv")
    grant(client, sa["headers"], appr["employment_id"], "approval", "APPROVE", "DEPARTMENT", "Approver")
    leave = factory.leave_for(req, start_date="2030-06-02", end_date="2030-06-02")
    return sa, req, appr, leave


def test_approval_request_views(client, factory):
    sa, req, _appr, leave = _setup(factory, client)
    h = sa["headers"]
    aid = leave["approval_id"]

    kpis = client.get("/api/v1/approvals/kpis", headers=h)
    assert kpis.status_code == 200, kpis.text
    assert kpis.json()["pending"] >= 1

    pending = client.get("/api/v1/approvals/pending", headers=h)
    assert pending.status_code == 200
    assert any(x["id"] == str(aid) for x in pending.json())

    my = client.get("/api/v1/approvals/my-requests", headers=h)
    assert my.status_code == 200

    approvers = client.get("/api/v1/approvals/approvers", headers=h)
    assert approvers.status_code == 200

    before = table_count(client, "approval_requests")
    created = client.post(
        "/api/v1/approvals/requests",
        json={
            "request_type": "LEAVE_REQUEST",
            "reference_id": 99001,
            "requester_employment_id": req["employment_id"],
            "target": "DEPARTMENT_HEAD",
        },
        headers=h,
    )
    assert created.status_code == 201, created.text
    assert table_count(client, "approval_requests") == before + 1
    direct_id = created.json()["id"]

    listed = client.get("/api/v1/approvals/requests", headers=h)
    assert listed.status_code == 200
    assert len(listed.json()) >= 2

    got = client.get(f"/api/v1/approvals/requests/{aid}", headers=h)
    assert got.status_code == 200

    by_ref = client.get(
        f"/api/v1/approvals/requests/by-reference/LEAVE_REQUEST/{leave['leave_id']}",
        headers=h,
    )
    assert by_ref.status_code == 200, by_ref.text

    ui = client.get(f"/api/v1/approvals/{direct_id}", headers=h)
    assert ui.status_code == 200, ui.text
    record_coverage("test_approval_request_views", COVERED[:9])


def test_approval_decisions_and_cancel_comment(client, factory):
    sa, req, appr, leave = _setup(factory, client)
    ah = appr["headers"]
    aid = leave["approval_id"]

    approved = client.post(
        f"/api/v1/approvals/requests/{aid}/approve",
        json={"remarks": "approved"},
        headers=ah,
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "APPROVED"

    leave2 = factory.leave_for(req, start_date="2030-06-09", end_date="2030-06-09")
    rejected = client.post(
        f"/api/v1/approvals/requests/{leave2['approval_id']}/reject",
        json={"remarks": "no capacity"},
        headers=ah,
    )
    assert rejected.status_code == 200, rejected.text
    assert rejected.json()["status"] == "REJECTED"

    leave3 = factory.leave_for(req, start_date="2030-06-16", end_date="2030-06-16")
    ui_approved = client.post(
        f"/api/v1/approvals/{leave3['approval_id']}/approve",
        json={"remarks": "ui approve"},
        headers=ah,
    )
    assert ui_approved.status_code == 200, ui_approved.text

    leave4 = factory.leave_for(req, start_date="2030-06-23", end_date="2030-06-23")
    ui_rejected = client.post(
        f"/api/v1/approvals/{leave4['approval_id']}/reject",
        json={"remarks": "ui reject"},
        headers=ah,
    )
    assert ui_rejected.status_code == 200, ui_rejected.text

    leave5 = factory.leave_for(req, start_date="2030-06-30", end_date="2030-06-30")
    comment = client.post(
        f"/api/v1/approvals/requests/{leave5['approval_id']}/comment",
        json={"remarks": "please expedite"},
        headers=ah,
    )
    assert comment.status_code == 201, comment.text

    cancelled = client.post(
        f"/api/v1/approvals/requests/{leave5['approval_id']}/cancel",
        json={"remarks": "withdrawn"},
        headers=ah,
    )
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["status"] == "CANCELLED"
    record_coverage("test_approval_decisions_and_cancel_comment", COVERED[9:])
