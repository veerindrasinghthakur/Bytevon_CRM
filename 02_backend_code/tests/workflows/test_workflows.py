"""Phase 5 business workflows (WORKFLOW_COUNT=8)."""
from __future__ import annotations

import pytest

from tests.modules.helpers import grant


def _sa(factory):
    return factory.super_admin()


def test_workflow_employee_onboarding(client, factory):
    """Onboarding: person+employment one-shot -> login -> role -> effective perms."""
    h = _sa(factory)["headers"]
    created = client.post(
        "/api/v1/workforce/employees",
        json={
            "first_name": "New",
            "last_name": "Hire",
            "employee_code": "EMP-ONB-1",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-07-01",
        },
        headers=h,
    )
    assert created.status_code == 201, created.text
    emp_id = created.json()["id"]
    person_id = created.json()["person_id"]

    employments = client.get(
        f"/api/v1/workforce/employments/by-person/{person_id}", headers=h
    )
    assert employments.status_code == 200
    assert any(e["id"] == emp_id for e in employments.json())

    user = client.post(
        "/api/v1/admin/users",
        json={
            "employmentId": emp_id,
            "email": "new.hire@example.com",
            "temporaryPassword": "TempPass123!",
        },
        headers=h,
    )
    assert user.status_code == 201, user.text

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "new.hire@example.com", "password": "TempPass123!"},
    )
    assert login.status_code == 200, login.text
    assert login.json()["employment_id"] == emp_id


def test_workflow_leave_approval_balance(client, factory):
    """Leave -> approval -> ledger consumption + balance decrement."""
    sa = _sa(factory)
    h = sa["headers"]
    req = factory.actor("wfl")
    appr = factory.actor("wfa")
    grant(client, h, appr["employment_id"], "approval", "APPROVE", "DEPARTMENT", "WF Approver")
    grant(client, h, req["employment_id"], "leave_request", "CREATE", "SELF", "WF Req Create")
    grant(client, h, req["employment_id"], "leave_request", "VIEW", "SELF", "WF Req View")

    client.post(
        "/api/v1/leave/ledger",
        json={
            "employment_id": req["employment_id"],
            "leave_type": "CASUAL",
            "transaction_type": "ENTITLEMENT",
            "days": "12.00",
        },
        headers=h,
    )
    before = client.get(
        f"/api/v1/leave/balances/{req['employment_id']}", headers=req["headers"]
    ).json()
    casual_before = float(
        next(b["balance_days"] for b in before["balances"] if b["leave_type"] == "CASUAL")
    )

    leave = client.post(
        "/api/v1/leave/requests",
        json={
            "employment_id": req["employment_id"],
            "leave_type": "CASUAL",
            "start_date": "2030-08-04",
            "end_date": "2030-08-05",
            "reason": "trip",
        },
        headers=req["headers"],
    )
    assert leave.status_code == 201, leave.text
    aid = leave.json()["approval_request_id"]

    decided = client.post(
        f"/api/v1/approvals/requests/{aid}/approve",
        json={"remarks": "ok"},
        headers=appr["headers"],
    )
    assert decided.status_code == 200, decided.text

    got = client.get(
        f"/api/v1/leave/requests/{leave.json()['id']}", headers=req["headers"]
    )
    assert got.json()["status"] == "APPROVED"

    after = client.get(
        f"/api/v1/leave/balances/{req['employment_id']}", headers=req["headers"]
    ).json()
    casual_after = float(
        next(b["balance_days"] for b in after["balances"] if b["leave_type"] == "CASUAL")
    )
    assert casual_after == pytest.approx(casual_before - 2.0)


def test_workflow_attendance_to_summary(client, factory):
    """Punch -> day -> rebuild summary -> summary reflects presence."""
    sa = _sa(factory)
    h = sa["headers"]
    me = factory.actor("wfat")
    grant(client, h, me["employment_id"], "attendance", "CREATE", "SELF", "WF Att Create")
    emp_id = me["employment_id"]

    punch = client.post(
        "/api/v1/workforce/attendance/punch",
        json={"employment_id": emp_id, "punch_type": "CHECK_IN"},
        headers=me["headers"],
    )
    assert punch.status_code == 201, punch.text

    rebuilt = client.post(
        f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/9/rebuild", headers=h
    )
    assert rebuilt.status_code == 200, rebuilt.text
    summary = client.get(
        f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/9",
        headers=me["headers"],
    )
    assert summary.status_code == 200, summary.text


def test_workflow_payroll_to_lock(client, factory):
    """Salary -> calculate -> approve -> pay -> downstream attendance lock."""
    sa = _sa(factory)
    h = sa["headers"]
    me = factory.actor("wfp")
    emp_id = me["employment_id"]
    client.post(
        "/api/v1/payroll/salaries",
        json={
            "employment_id": emp_id,
            "effective_from": "2026-01-01",
            "gross_salary": "60000.00",
            "items": [{"name": "Basic", "type": "EARNING", "amount": "60000.00"}],
        },
        headers=h,
    )
    calc = client.post(
        "/api/v1/payroll/calculate",
        json={"employment_id": emp_id, "year": 2026, "month": 9},
        headers=h,
    )
    assert calc.status_code == 201, calc.text
    pid = calc.json()["id"]
    assert client.post(f"/api/v1/payroll/{pid}/approve", headers=h).status_code == 200
    paid = client.post(
        f"/api/v1/payroll/{pid}/pay",
        json={"payment_method": "BANK_TRANSFER"},
        headers=h,
    )
    assert paid.status_code == 200, paid.text
    assert paid.json()["status"] == "PAID"


def test_workflow_project_task_time(client, factory):
    """Project -> task -> time entry aggregation."""
    sa = _sa(factory)
    h = sa["headers"]
    me = factory.actor("wfpj")
    team = client.post(
        "/api/v1/projects/teams",
        json={"name": "WF Team", "team_head_employment_id": me["employment_id"]},
        headers=h,
    ).json()
    cli = client.post(
        "/api/v1/sales/clients",
        json={"client_type": "COMPANY", "client_name": "WFCo"},
        headers=h,
    ).json()
    project = client.post(
        "/api/v1/projects/",
        json={
            "client_id": cli["id"],
            "project_name": "WF Project",
            "assignment_type": "TEAM",
            "assigned_to_id": team["id"],
        },
        headers=h,
    )
    assert project.status_code == 201, project.text
    pid = project.json()["id"]
    task = client.post(
        "/api/v1/projects/tasks",
        json={
            "project_id": pid,
            "title": "WF Task",
            "assignee_employment_id": sa["employment_id"],
        },
        headers=h,
    )
    assert task.status_code == 201, task.text
    entry = client.post(
        "/api/v1/projects/time-entries",
        json={
            "task_id": task.json()["id"],
            "work_date": "2026-09-11",
            "duration_minutes": 90,
        },
        headers=h,
    )
    assert entry.status_code == 201, entry.text
    entries = client.get(
        f"/api/v1/projects/tasks/{task.json()['id']}/time-entries", headers=h
    )
    assert entries.status_code == 200
    assert sum(e["duration_minutes"] for e in entries.json()) >= 90


def test_workflow_client_contact_lead(client, factory):
    """Client -> contact -> lead linked to client."""
    h = _sa(factory)["headers"]
    cli = client.post(
        "/api/v1/sales/clients",
        json={"client_type": "COMPANY", "client_name": "PipeCo"},
        headers=h,
    ).json()
    contact = client.post(
        f"/api/v1/sales/clients/{cli['id']}/contacts",
        json={"client_id": cli["id"], "name": "Buyer", "email": "buyer@pipeco.example"},
        headers=h,
    )
    assert contact.status_code == 201, contact.text
    lead = client.post(
        "/api/v1/sales/leads",
        json={
            "lead_title": "PipeCo Deal",
            "contact_name": "Buyer",
            "client_id": cli["id"],
        },
        headers=h,
    )
    assert lead.status_code == 201, lead.text
    got = client.get(f"/api/v1/sales/leads/{lead.json()['id']}", headers=h)
    assert got.status_code == 200
    assert got.json()["client_id"] == cli["id"]


def test_workflow_approval_downstream_correction(client, factory):
    """Attendance correction -> approval -> punches applied to the day."""
    sa = _sa(factory)
    h = sa["headers"]
    me = factory.actor("wfc")
    appr = factory.actor("wfa2")
    grant(client, h, me["employment_id"], "attendance", "CREATE", "SELF", "WF C Create")
    grant(client, h, appr["employment_id"], "approval", "APPROVE", "DEPARTMENT", "WF C Approve")
    emp_id = me["employment_id"]

    punch = client.post(
        "/api/v1/workforce/attendance/punch",
        json={"employment_id": emp_id, "punch_type": "CHECK_IN"},
        headers=me["headers"],
    )
    assert punch.status_code == 201, punch.text
    day_id = punch.json()["attendance_day_id"]

    corr = client.post(
        "/api/v1/workforce/attendance/corrections",
        json={
            "attendance_day_id": day_id,
            "requested_check_out": "2026-09-19T18:00:00+00:00",
            "reason": "missed checkout",
        },
        headers=me["headers"],
    )
    assert corr.status_code == 201, corr.text
    approval_id = corr.json()["approval_request_id"]
    assert approval_id is not None

    decided = client.post(
        f"/api/v1/approvals/requests/{approval_id}/approve",
        json={"remarks": "ok"},
        headers=appr["headers"],
    )
    assert decided.status_code == 200, decided.text

    got = client.get(
        f"/api/v1/workforce/attendance/corrections/{corr.json()['id']}",
        headers=me["headers"],
    )
    assert got.json()["status"] == "APPROVED"


def test_workflow_user_state_transitions(client, factory):
    """Deactivate/lock blocks login; activate/unlock restores."""
    h = _sa(factory)["headers"]
    person = client.post(
        "/api/v1/workforce/persons",
        json={"first_name": "State", "last_name": "User"},
        headers=h,
    ).json()
    emp = client.post(
        "/api/v1/workforce/employments",
        json={
            "person_id": person["id"],
            "employee_code": "EMP-STATE-1",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-08-01",
        },
        headers=h,
    ).json()
    user = client.post(
        "/api/v1/admin/users",
        json={
            "employmentId": emp["id"],
            "email": "state.user@example.com",
            "temporaryPassword": "TempPass123!",
        },
        headers=h,
    ).json()

    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "state.user@example.com", "password": "TempPass123!"},
        ).status_code
        == 200
    )
    assert (
        client.post(f"/api/v1/admin/users/{user['id']}/deactivate", headers=h).status_code
        == 200
    )
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "state.user@example.com", "password": "TempPass123!"},
        ).status_code
        == 401
    )
    assert (
        client.post(f"/api/v1/admin/users/{user['id']}/activate", headers=h).status_code
        == 200
    )
    assert (
        client.post(f"/api/v1/admin/users/{user['id']}/lock", headers=h).status_code
        == 200
    )
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "state.user@example.com", "password": "TempPass123!"},
        ).status_code
        == 401
    )
    assert (
        client.post(f"/api/v1/admin/users/{user['id']}/unlock", headers=h).status_code
        == 200
    )
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "state.user@example.com", "password": "TempPass123!"},
        ).status_code
        == 200
    )
