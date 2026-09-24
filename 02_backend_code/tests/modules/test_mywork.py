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
    ("GET", "/api/v1/dashboard/employee"),
    ("GET", "/api/v1/my-work/tasks/projects"),
    ("POST", "/api/v1/my-work/tasks"),
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
            "from": "2030-07-08",
            "to": "2030-07-09",
        },
        headers=ah,
    )
    assert calc.status_code == 200, calc.text
    assert float(calc.json()["day_cost"]) == 2.0

    submitted = client.post(
        "/api/v1/my-work/leave",
        json={
            "type": "LOSS_OF_PAY",
            # Monday: canonical working-day count rejects weekend-only ranges
            "from_date": "2030-07-15",
            "to_date": "2030-07-15",
            "reason": "family event",
        },
        headers=ah,
    )
    assert submitted.status_code in (200, 201), submitted.text
    # Q14: my-work writes through to the real domain (no fake UUID).
    assert submitted.json()["id"].isdigit()
    relisted = client.get("/api/v1/my-work/leave", headers=ah)
    assert relisted.status_code == 200, relisted.text
    assert any(i["id"] == submitted.json()["id"] for i in relisted.json()["items"])
    record_coverage("test_my_work_leave", COVERED[:6])


def test_my_work_tasks_requests_approvals(client, factory):
    sa, me = _owner_with(client, factory)
    ah = me["headers"]

    assert client.get("/api/v1/my-work/tasks", headers=ah).status_code == 200
    assert client.get("/api/v1/my-work/requests", headers=ah).status_code == 200
    appr = client.get("/api/v1/my-work/approvals", headers=ah)
    assert appr.status_code == 200
    for item in appr.json()["items"]:
        assert item["title"], item
        assert item["requester"] and not str(item["requester"]).startswith("Emp #"), item
    overview = client.get("/api/v1/my-work/overview", headers=ah)
    assert overview.status_code == 200, overview.text
    body = overview.json()
    assert body["user"]["employmentId"] == me["employment_id"]
    assert len(body["metrics"]) == 5
    assert isinstance(body["notifications"], list)
    assert isinstance(body["events"], list)
    assert isinstance(body["tasks"], list)
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
    directory = client.get("/api/v1/my-work/approvers", headers=ah).json()
    assert len(directory) > 0, "approver directory must not be empty"
    assert all(a["name"] and not str(a["name"]).startswith("Emp #") for a in directory), directory

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


def test_my_work_self_task_create(client, factory):
    sa = factory.super_admin()
    h = sa["headers"]
    actor = factory.actor("mwt")
    emp_id = actor["employment_id"]
    grant(client, h, emp_id, "task", "VIEW", "SELF", "MW Task View")
    grant(client, h, emp_id, "task", "CREATE", "SELF", "MW Task Create")

    team = client.post(
        "/api/v1/projects/teams",
        json={"name": "SelfTeam", "team_head_employment_id": emp_id},
        headers=h,
    )
    assert team.status_code == 201, team.text
    team_id = team.json()["id"]
    # Team head is an active member by default — no separate add needed.
    client_obj = client.post(
        "/api/v1/sales/clients",
        json={"client_type": "COMPANY", "client_name": "SelfCo"},
        headers=h,
    ).json()
    project = client.post(
        "/api/v1/projects/",
        json={
            "client_id": client_obj["id"],
            "project_name": "Self Project",
            "assignment_type": "TEAM",
            "assigned_to_id": team_id,
        },
        headers=h,
    )
    assert project.status_code == 201, project.text
    project_id = project.json()["id"]
    activated = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"status": "ACTIVE"},
        headers=h,
    )
    assert activated.status_code == 200, activated.text

    mine = client.get("/api/v1/my-work/tasks/projects", headers=actor["headers"])
    assert mine.status_code == 200, mine.text
    assert any(p["id"] == project_id for p in mine.json())

    # Unknown project → 404.
    missing = client.post(
        "/api/v1/my-work/tasks",
        json={"project_id": 999999, "title": "Nope"},
        headers=actor["headers"],
    )
    assert missing.status_code == 404, missing.text

    created = client.post(
        "/api/v1/my-work/tasks",
        json={
            "project_id": project_id,
            "title": "My self task",
            "priority": "HIGH",
            "estimated_hours": "2.5",
        },
        headers=actor["headers"],
    )
    assert created.status_code == 201, created.text
    assert created.json()["assignee_employment_id"] == emp_id
    assert created.json()["status"] == "TODO"

    listed = client.get("/api/v1/my-work/tasks", headers=actor["headers"])
    assert listed.status_code == 200, listed.text
    assert any(i["id"] == str(created.json()["id"]) for i in listed.json()["items"])
    assert all("created_at" in i for i in listed.json()["items"])

    # Inactive project → 400.
    client.patch(
        f"/api/v1/projects/{project_id}",
        json={"status": "ON_HOLD"},
        headers=h,
    )
    blocked = client.post(
        "/api/v1/my-work/tasks",
        json={"project_id": project_id, "title": "Blocked"},
        headers=actor["headers"],
    )
    assert blocked.status_code == 400, blocked.text
    record_coverage("test_my_work_self_task_create", COVERED[30:32])


def test_my_work_leave_approver_and_withdraw_ledger(client, factory):
    sa = factory.super_admin()
    h = sa["headers"]
    requester = factory.actor("lva")
    head = factory.actor("lvh")
    req_id = requester["employment_id"]
    head_id = head["employment_id"]
    grant(client, h, req_id, "leave_request", "CREATE", "SELF", "LVA Create")
    grant(client, h, req_id, "leave_request", "VIEW", "SELF", "LVA View")
    grant(client, h, req_id, "approval", "VIEW", "SELF", "LVA Approvals")

    dept = client.post(
        "/api/v1/workforce/departments",
        json={"name": "ApprDept", "department_head_employment_id": head_id},
        headers=h,
    )
    assert dept.status_code == 201, dept.text
    dept_id = dept.json()["id"]
    assign = client.post(
        f"/api/v1/workforce/departments/{dept_id}/assign",
        json={"employmentId": req_id},
        headers=h,
    )
    assert assign.status_code == 200, assign.text

    credit = client.post(
        "/api/v1/leave/ledger",
        json={
            "employment_id": req_id,
            "leave_type": "CASUAL",
            "transaction_type": "ENTITLEMENT",
            "days": "10.00",
        },
        headers=h,
    )
    assert credit.status_code == 201, credit.text

    submitted = client.post(
        "/api/v1/my-work/leave",
        json={
            "type": "CASUAL",
            "from_date": "2030-09-09",
            "to_date": "2030-09-10",
            "reason": "approver probe",
        },
        headers=requester["headers"],
    )
    assert submitted.status_code in (200, 201), submitted.text
    leave_id = submitted.json()["id"]

    listed = client.get("/api/v1/my-work/leave", headers=requester["headers"])
    assert listed.status_code == 200, listed.text
    row = next(i for i in listed.json()["items"] if i["id"] == leave_id)
    # Pending → waiting on the department head.
    assert row["approver"] != "", row

    held = client.get(
        f"/api/v1/leave/balances/{req_id}", headers=requester["headers"]
    ).json()["balances"]
    casual = next(b for b in held if b["leave_type"] == "CASUAL")
    assert float(casual["balance_days"]) == 8.0, held

    mine = client.get("/api/v1/my-work/approvals", headers=requester["headers"])
    assert mine.status_code == 200, mine.text
    appr = next(
        a for a in mine.json()["items"] if a.get("request_type") == "LEAVE_REQUEST"
    )
    approved = client.post(
        f"/api/v1/approvals/{appr['id']}/approve",
        json={"remarks": "Enjoy!"},
        headers=h,
    )
    assert approved.status_code == 200, approved.text

    relisted = client.get("/api/v1/my-work/leave", headers=requester["headers"])
    row2 = next(i for i in relisted.json()["items"] if i["id"] == leave_id)
    assert row2["status"] == "Approved", row2
    assert row2["approver"] == "System Admin", row2
    assert row2["approver_remarks"] == "Enjoy!", row2
    assert row2["decided_on"], row2

    # Fresh pending request withdrawn → HOLD released, balance back to 8.
    sub2 = client.post(
        "/api/v1/my-work/leave",
        json={
            "type": "CASUAL",
            "from_date": "2030-09-16",
            "to_date": "2030-09-16",
            "reason": "withdraw probe",
        },
        headers=requester["headers"],
    )
    assert sub2.status_code in (200, 201), sub2.text
    leave2 = sub2.json()["id"]
    mid = client.get(
        f"/api/v1/leave/balances/{req_id}", headers=requester["headers"]
    ).json()["balances"]
    assert float(next(b for b in mid if b["leave_type"] == "CASUAL")["balance_days"]) == 7.0
    cancelled = client.post(
        f"/api/v1/leave/requests/{leave2}/cancel", headers=requester["headers"]
    )
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["status"] == "CANCELLED"
    after = client.get(
        f"/api/v1/leave/balances/{req_id}", headers=requester["headers"]
    ).json()["balances"]
    assert float(next(b for b in after if b["leave_type"] == "CASUAL")["balance_days"]) == 8.0
    record_coverage("test_my_work_leave_approver_and_withdraw_ledger", [])


def test_profile_and_dashboard(client, factory):
    sa, me = _owner_with(client, factory)
    ah = me["headers"]

    got = client.get("/api/v1/profile/me", headers=ah)
    assert got.status_code == 200, got.text
    assert got.json()["employmentId"] == me["employment_id"]
    assert got.json()["name"] != ""

    patched = client.patch(
        "/api/v1/profile/me", json={"phone": "+91-9000000001"}, headers=ah
    )
    assert patched.status_code == 200, patched.text
    assert client.get("/api/v1/profile/me", headers=ah).json()["phone"] == "+91-9000000001"

    prefs = client.get("/api/v1/profile/preferences", headers=ah)
    assert prefs.status_code == 200, prefs.text
    assert prefs.json()["language"] == "en"
    updated = client.patch(
        "/api/v1/profile/preferences",
        json={"language": "de", "emailNotifications": False},
        headers=ah,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["language"] == "de"
    assert updated.json()["emailNotifications"] is False

    act = client.get("/api/v1/profile/activity", params={"limit": 5}, headers=ah)
    assert act.status_code == 200, act.text
    assert len(act.json()["items"]) <= 5

    sessions = client.get(
        "/api/v1/profile/sessions",
        params={},
        headers={**ah, "X-Login-Id": str(me["login_id"])},
    )
    assert sessions.status_code == 200, sessions.text

    auth_sessions = client.get(
        "/api/v1/auth/sessions",
        headers={**ah, "X-Login-Id": str(me["login_id"])},
    )
    assert auth_sessions.status_code == 200, auth_sessions.text
    assert len(auth_sessions.json()) >= 1
    other = client.post(
        "/api/v1/auth/login",
        json={"email": me["email"], "password": me["password"]},
    )
    assert other.status_code == 200, other.text
    other_sid = other.json()["session_id"]
    assert other_sid is not None
    revoked = client.post(
        "/api/v1/auth/sessions/revoke-others",
        params={"keep_session_id": other_sid},
        headers={
            **ah,
            "X-Login-Id": str(me["login_id"]),
            "Authorization": f"Bearer {other.json()['tokens']['access_token']}",
        },
    )
    assert revoked.status_code == 200, revoked.text
    remaining = client.get(
        "/api/v1/auth/sessions",
        headers={
            **ah,
            "X-Login-Id": str(me["login_id"]),
            "Authorization": f"Bearer {other.json()['tokens']['access_token']}",
        },
    )
    assert remaining.status_code == 200, remaining.text
    assert [s["id"] for s in remaining.json()] == [other_sid]

    dash = client.get("/api/v1/dashboard/executive", headers=sa["headers"])
    assert dash.status_code == 200, dash.text
    assert "presentToday" in dash.json()["meta"]
    assert all("id" in p for p in dash.json()["pending"])

    emp = client.get("/api/v1/dashboard/employee", headers=ah)
    assert emp.status_code == 200, emp.text
    body = emp.json()
    assert body["meta"]["employeeId"]
    assert len(body["meta"]["weekBars"]) == 7
    assert len(body["kpis"]) == 5
    record_coverage("test_profile_and_dashboard", COVERED[18:])
