"""Phase 4: my-work self-service + dashboard."""
from __future__ import annotations

from tests.modules.helpers import grant, record_coverage

COVERED = [
    ("GET", "/api/v1/my-work/leave"),
    ("GET", "/api/v1/my-work/leave/balances"),
    ("GET", "/api/v1/my-work/leave/types"),
    ("GET", "/api/v1/my-work/leave/apply-context"),
    ("POST", "/api/v1/my-work/leave/calculate"),
    ("POST", "/api/v1/my-work/leave"),
    ("GET", "/api/v1/my-work/tasks"),
    ("GET", "/api/v1/my-work/requests"),
    ("GET", "/api/v1/my-work/approvals"),
    ("POST", "/api/v1/my-work/attendance/punch"),
    ("POST", "/api/v1/my-work/attendance/breaks/start"),
    ("POST", "/api/v1/my-work/attendance/breaks/{break_id}/end"),
    ("GET", "/api/v1/my-work/attendance/days"),
    ("GET", "/api/v1/my-work/attendance/today-info"),
    ("GET", "/api/v1/my-work/attendance/week-hours"),
    ("GET", "/api/v1/my-work/attendance/corrections"),
    ("GET", "/api/v1/my-work/attendance/correction-candidates"),
    ("GET", "/api/v1/my-work/approvers"),
    ("GET", "/api/v1/profile/me"),
    ("PATCH", "/api/v1/profile/me"),
    ("GET", "/api/v1/profile/activity"),
    ("GET", "/api/v1/profile/sessions"),
    ("GET", "/api/v1/dashboard/executive"),
]


def _owner_with(client, factory):
    sa = factory.super_admin()
    h = sa["headers"]
    me = factory.actor("mw")
    grant(client, h, me["employment_id"], "leave_request", "VIEW", "SELF", "MW Leave View")
    grant(client, h, me["employment_id"], "leave_request", "CREATE", "SELF", "MW Leave Create")
    grant(client, h, me["employment_id"], "task", "VIEW", "SELF", "MW Task View")
    grant(client, h, me["employment_id"], "approval", "VIEW", "SELF", "MW Approval View")
    grant(client, h, me["employment_id"], "attendance", "VIEW", "SELF", "MW Att View")
    grant(client, h, me["employment_id"], "attendance", "CREATE", "SELF", "MW Att Create")
    grant(client, h, me["employment_id"], "employment", "VIEW", "SELF", "MW Emp View")
    grant(client, h, me["employment_id"], "employment", "UPDATE", "SELF", "MW Emp Update")
    return sa, me


def test_my_work_leave(client, factory):
    sa, me = _owner_with(client, factory)
    ah = me["headers"]

    listed = client.get("/api/v1/my-work/leave", headers=ah)
    assert listed.status_code == 200, listed.text

    balances = client.get("/api/v1/my-work/leave/balances", headers=ah)
    assert balances.status_code == 200, balances.text

    types = client.get("/api/v1/my-work/leave/types", headers=ah)
    assert types.status_code == 200, types.text

    ctx = client.get("/api/v1/my-work/leave/apply-context", headers=ah)
    assert ctx.status_code == 200, ctx.text

    calc = client.post(
        "/api/v1/my-work/leave/calculate",
        json={
            "type": "CASUAL",
            "from": "2030-07-06",
            "to": "2030-07-07",
        },
        headers=ah,
    )
    assert calc.status_code == 200, calc.text

    submitted = client.post(
        "/api/v1/my-work/leave",
        json={
            "type": "LOSS_OF_PAY",
            "from_date": "2030-07-13",
            "to_date": "2030-07-13",
            "reason": "family event",
        },
        headers=ah,
    )
    assert submitted.status_code in (200, 201), submitted.text
    record_coverage("test_my_work_leave", COVERED[:6])


def test_my_work_tasks_requests_approvals(client, factory):
    sa, me = _owner_with(client, factory)
    ah = me["headers"]

    assert client.get("/api/v1/my-work/tasks", headers=ah).status_code == 200
    assert client.get("/api/v1/my-work/requests", headers=ah).status_code == 200
    assert client.get("/api/v1/my-work/approvals", headers=ah).status_code == 200
    record_coverage("test_my_work_tasks_requests_approvals", COVERED[6:9])


def test_my_work_attendance(client, factory):
    sa, me = _owner_with(client, factory)
    ah = me["headers"]

    punch = client.post(
        "/api/v1/my-work/attendance/punch",
        json={"employment_id": me["employment_id"], "punch_type": "CHECK_IN"},
        headers=ah,
    )
    assert punch.status_code == 201, punch.text

    assert client.get("/api/v1/my-work/attendance/days", headers=ah).status_code == 200
    assert client.get("/api/v1/my-work/attendance/today-info", headers=ah).status_code == 200
    assert client.get("/api/v1/my-work/attendance/week-hours", headers=ah).status_code == 200
    assert (
        client.get("/api/v1/my-work/attendance/corrections", headers=ah).status_code
        == 200
    )
    assert (
        client.get(
            "/api/v1/my-work/attendance/correction-candidates", headers=ah
        ).status_code
        == 200
    )
    assert client.get("/api/v1/my-work/approvers", headers=ah).status_code == 200

    brk = client.post(
        "/api/v1/my-work/attendance/breaks/start",
        json={"attendance_day_id": punch.json()["attendance_day_id"]},
        headers=ah,
    )
    assert brk.status_code == 201, brk.text
    end = client.post(
        f"/api/v1/my-work/attendance/breaks/{brk.json()['id']}/end",
        json={},
        headers=ah,
    )
    assert end.status_code == 200, end.text
    record_coverage("test_my_work_attendance", COVERED[9:18])


def test_profile_and_dashboard(client, factory):
    sa, me = _owner_with(client, factory)
    ah = me["headers"]

    got = client.get("/api/v1/profile/me", headers=ah)
    assert got.status_code == 200, got.text

    patched = client.patch(
        "/api/v1/profile/me", json={"display_name": "Test User"}, headers=ah
    )
    assert patched.status_code == 200, patched.text

    assert client.get("/api/v1/profile/activity", headers=ah).status_code == 200

    sessions = client.get(
        "/api/v1/profile/sessions",
        params={},
        headers={**ah, "X-Login-Id": str(me["login_id"])},
    )
    assert sessions.status_code == 200, sessions.text

    dash = client.get("/api/v1/dashboard/executive", headers=sa["headers"])
    assert dash.status_code == 200, dash.text
    record_coverage("test_profile_and_dashboard", COVERED[18:])
