"""Stage 2: lifecycle transition tests for the approved workflow decisions.

Q1 assignment overlap 409 · Q2 separation cascade · Q3 archive guards ·
Q4 payroll reject · Q5 approved-leave cancel + REVERSAL · Q6 role names ·
Q7 rehire · Q8 attendance unlock · Q11 bulk run · Q12 lead opt-in project ·
Q13 HOLD accounting · Q16 restore.
"""
from __future__ import annotations

from sqlalchemy import select

from app.modules.leave.models import LeaveLedger, LeaveRequest
from app.modules.workforce.department.models import Department
from app.modules.workforce.models import Employment
from tests.modules.helpers import db_scalar, grant, record_coverage

COVERED = [
    ("POST", "/api/v1/workforce/employments/{employment_id}/assignments"),
    ("POST", "/api/v1/workforce/employments/{employment_id}/state"),
    ("POST", "/api/v1/workforce/employments/{employment_id}/rehire"),
    ("POST", "/api/v1/workforce/departments/{department_id}/restore"),
    ("POST", "/api/v1/workforce/positions/{position_id}/restore"),
    ("POST", "/api/v1/payroll/{payroll_id}/reject"),
    ("POST", "/api/v1/leave/requests/{request_id}/request-cancel"),
    ("POST", "/api/v1/workforce/attendance/summaries/{employment_id}/{year}/{month}/unlock"),
    ("POST", "/api/v1/payroll/run"),
    ("POST", "/api/v1/sales/leads/{lead_id}/status"),
    ("POST", "/api/v1/rbac/roles/{role_id}/restore"),
    ("POST", "/api/v1/admin/users/{login_id}/restore"),
]


def _sa(factory):
    return factory.super_admin()


def _assignment(client, h, emp_id, start, reason="transfer"):
    return client.post(
        f"/api/v1/workforce/employments/{emp_id}/assignments",
        json={
            "work_mode": "OFFICE",
            "effective_from": start,
            "change_reason": reason,
        },
        headers=h,
    )


def test_q1_overlapping_assignment_rejected(client, factory):
    """Q1: backdated/overlapping assignments return 409; clean future rows work."""
    h = _sa(factory)["headers"]
    actor = factory.actor("q1ov")
    emp_id = actor["employment_id"]

    first = _assignment(client, h, emp_id, "2024-06-01", reason="initial role")
    assert first.status_code in (200, 201), first.text

    # Backdated row overlapping history -> 409 (no silent latest-wins).
    overlap = _assignment(client, h, emp_id, "2024-05-15", reason="backdate clash")
    assert overlap.status_code == 409, overlap.text

    # Clean future row closes the predecessor and succeeds.
    future = _assignment(client, h, emp_id, "2025-01-01", reason="promotion")
    assert future.status_code in (200, 201), future.text

    # A row that would swallow the future row -> 409.
    swallow = _assignment(client, h, emp_id, "2024-07-01", reason="swallow future")
    assert swallow.status_code == 409, swallow.text
    record_coverage("test_q1_overlapping_assignment_rejected", COVERED[:1])


def test_q2_separation_cascade(client, factory):
    """Q2: separation closes assignment, deactivates login, revokes sessions,
    cancels pending leave + approvals; history rows are preserved."""
    h = _sa(factory)["headers"]
    actor = factory.actor("q2sep")
    emp_id = actor["employment_id"]
    grant(client, h, emp_id, "leave_request", "CREATE", "SELF", "Q2 Leave Create")

    _assignment(client, h, emp_id, "2024-06-01", reason="initial role")

    # The factory actor already owns a login + active session for this person.
    from app.modules.auth.models import Login as _Login

    person_id = db_scalar(
        client, select(Employment.person_id).where(Employment.id == emp_id)
    )
    login_id = db_scalar(
        client, select(_Login.id).where(_Login.person_id == person_id)
    )
    assert login_id is not None

    # Pending leave owned by the employee (LOSS_OF_PAY needs no balance).
    # Mon/Tue: canonical working-day count rejects weekend-only ranges.
    leave = client.post(
        "/api/v1/leave/requests",
        json={
            "employment_id": emp_id,
            "leave_type": "LOSS_OF_PAY",
            "start_date": "2030-09-09",
            "end_date": "2030-09-10",
            "reason": "separation probe",
        },
        headers=actor["headers"],
    )
    assert leave.status_code == 201, leave.text
    leave_id = leave.json()["id"]
    approval_id = leave.json()["approval_request_id"]

    before_assignments = db_scalar(
        client,
        select(Employment.id).where(Employment.id == emp_id),
    )
    assert before_assignments == emp_id

    separated = client.post(
        f"/api/v1/workforce/employments/{emp_id}/state",
        json={
            "new_state": "RESIGNED",
            "effective_date": "2024-08-01",
            "reason": "resigned",
        },
        headers=h,
    )
    assert separated.status_code == 200, separated.text

    # Assignment closed at the separation date (row preserved, not deleted).
    from datetime import date as _date

    from app.modules.workforce.models import EmploymentAssignment
    from tests.modules.helpers import db_all

    rows = db_all(
        client,
        select(
            EmploymentAssignment.effective_from, EmploymentAssignment.effective_to
        ).where(EmploymentAssignment.employment_id == emp_id),
    )
    assert len(rows) >= 1
    assert all(r[1] is not None and r[1] <= _date(2024, 8, 1) for r in rows)

    # Login deactivated and active sessions revoked.
    from app.core.db.enums import SessionStatus
    from app.modules.auth.models import Login, Session

    assert (
        db_scalar(client, select(Login.is_active).where(Login.id == login_id))
        is False
    )
    assert (
        db_scalar(
            client,
            select(Session.id).where(
                Session.login_id == login_id,
                Session.status == SessionStatus.ACTIVE,
            ),
        )
        is None
    )

    # Pending leave + approval cancelled, history preserved.
    assert (
        db_scalar(client, select(LeaveRequest.status).where(LeaveRequest.id == leave_id)).value
        == "CANCELLED"
    )
    from app.modules.approvals.models import ApprovalRequest

    assert (
        db_scalar(
            client,
            select(ApprovalRequest.status).where(ApprovalRequest.id == approval_id),
        ).value
        == "CANCELLED"
    )

    # New assignments for separated employments are refused.
    refused = _assignment(client, h, emp_id, "2024-09-01", reason="after exit")
    assert refused.status_code in (400, 409, 422), refused.text
    record_coverage("test_q2_separation_cascade", [COVERED[1]])


def test_q3_archive_guard_department_position(client, factory):
    """Q3: archiving a referenced department/position returns 409."""
    h = _sa(factory)["headers"]
    actor = factory.actor("q3gd")
    emp_id = actor["employment_id"]

    dept = client.post(
        "/api/v1/workforce/departments", json={"name": "Q3 Guarded"}, headers=h
    )
    assert dept.status_code == 201, dept.text
    dept_id = dept.json()["id"]

    pos = client.post(
        "/api/v1/workforce/positions", json={"name": "Q3 Guarded Position"}, headers=h
    )
    assert pos.status_code == 201, pos.text
    pos_id = pos.json()["id"]

    asg = client.post(
        f"/api/v1/workforce/employments/{emp_id}/assignments",
        json={
            "department_id": dept_id,
            "position_id": pos_id,
            "work_mode": "OFFICE",
            "effective_from": "2024-06-01",
            "change_reason": "staffing probe",
        },
        headers=h,
    )
    assert asg.status_code in (200, 201), asg.text

    blocked_dept = client.delete(f"/api/v1/workforce/departments/{dept_id}", headers=h)
    assert blocked_dept.status_code == 409, blocked_dept.text
    assert (
        db_scalar(client, select(Department.is_archived).where(Department.id == dept_id))
        is False
    )

    blocked_pos = client.delete(f"/api/v1/workforce/positions/{pos_id}", headers=h)
    assert blocked_pos.status_code == 409, blocked_pos.text
    record_coverage("test_q3_archive_guard_department_position", [])


def test_q4_payroll_reject_and_paid_terminal(client, factory):
    """Q4: APPROVED -> CALCULATED reject with reason; PAID is terminal."""
    h = _sa(factory)["headers"]
    actor = factory.actor("q4rej")
    emp_id = actor["employment_id"]
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
        json={"employment_id": emp_id, "year": 2026, "month": 10},
        headers=h,
    )
    assert calc.status_code == 201, calc.text
    pid = calc.json()["id"]
    assert client.post(f"/api/v1/payroll/{pid}/approve", headers=h).status_code == 200

    rejected = client.post(
        f"/api/v1/payroll/{pid}/reject", json={"reason": "wrong inputs"}, headers=h
    )
    assert rejected.status_code == 200, rejected.text
    assert rejected.json()["status"] == "CALCULATED"

    # Reject requires a reason.
    assert client.post(f"/api/v1/payroll/{pid}/approve", headers=h).status_code == 200
    no_reason = client.post(f"/api/v1/payroll/{pid}/reject", json={"reason": "  "}, headers=h)
    assert no_reason.status_code in (400, 422), no_reason.text

    paid = client.post(
        f"/api/v1/payroll/{pid}/pay",
        json={"payment_method": "BANK_TRANSFER", "payment_reference": "Q4-001"},
        headers=h,
    )
    assert paid.status_code == 200, paid.text

    after_paid = client.post(
        f"/api/v1/payroll/{pid}/reject", json={"reason": "too late"}, headers=h
    )
    assert after_paid.status_code in (400, 422), after_paid.text
    record_coverage("test_q4_payroll_reject_and_paid_terminal", [COVERED[5]])


def test_q5_approved_leave_cancel_reversal(client, factory):
    """Q5/Q13: HOLD on submit, CONSUMPTION on approve, REVERSAL on approved cancel."""
    h = _sa(factory)["headers"]
    req = factory.actor("q5lc")
    appr = factory.actor("q5ap")
    grant(client, h, appr["employment_id"], "approval", "APPROVE", "DEPARTMENT", "Q5 Approver")
    grant(client, h, req["employment_id"], "leave_request", "CREATE", "SELF", "Q5 Leave Create")
    grant(client, h, req["employment_id"], "leave_request", "UPDATE", "SELF", "Q5 Leave Update")
    emp_id = req["employment_id"]
    client.post(
        "/api/v1/leave/ledger",
        json={
            "employment_id": emp_id,
            "leave_type": "CASUAL",
            "transaction_type": "ENTITLEMENT",
            "days": "12.00",
        },
        headers=h,
    )

    leave = client.post(
        "/api/v1/leave/requests",
        json={
            "employment_id": emp_id,
            "leave_type": "CASUAL",
            # Mon/Tue -> 2 working days
            "start_date": "2030-10-07",
            "end_date": "2030-10-08",
            "reason": "q5 probe",
        },
        headers=req["headers"],
    )
    assert leave.status_code == 201, leave.text
    lid = leave.json()["id"]
    aid = leave.json()["approval_request_id"]

    holds = db_scalar(
        client,
        select(LeaveLedger.days).where(
            LeaveLedger.reference_id == lid,
            LeaveLedger.transaction_type == "HOLD",
        ),
    )
    assert holds is not None and float(holds) < 0

    approved = client.post(
        f"/api/v1/approvals/requests/{aid}/approve",
        json={"remarks": "ok"},
        headers=appr["headers"],
    )
    assert approved.status_code == 200, approved.text

    cancel_req = client.post(
        f"/api/v1/leave/requests/{lid}/request-cancel", headers=req["headers"]
    )
    assert cancel_req.status_code in (200, 201), cancel_req.text
    cancel_aid = cancel_req.json()["id"]

    cancel_ok = client.post(
        f"/api/v1/approvals/requests/{cancel_aid}/approve",
        json={"remarks": "cancel ok"},
        headers=appr["headers"],
    )
    assert cancel_ok.status_code == 200, cancel_ok.text

    assert (
        db_scalar(client, select(LeaveRequest.status).where(LeaveRequest.id == lid)).value
        == "CANCELLED"
    )
    reversal = db_scalar(
        client,
        select(LeaveLedger.days).where(
            LeaveLedger.reference_id == lid,
            LeaveLedger.transaction_type == "REVERSAL",
        ),
    )
    assert reversal is not None and float(reversal) > 0
    # Original CONSUMPTION row is never modified/deleted.
    consumption = db_scalar(
        client,
        select(LeaveLedger.days).where(
            LeaveLedger.reference_id == lid,
            LeaveLedger.transaction_type == "CONSUMPTION",
        ),
    )
    assert consumption is not None and float(consumption) < 0
    record_coverage("test_q5_approved_leave_cancel_reversal", [COVERED[6]])


def test_q6_role_name_reserved_after_archive(client, factory):
    """Q6: archived role names stay reserved (409, no IntegrityError)."""
    h = _sa(factory)["headers"]
    created = client.post(
        "/api/v1/rbac/roles", json={"name": "Q6 Reserved", "description": "probe"}, headers=h
    )
    assert created.status_code in (200, 201), created.text
    rid = created.json()["id"]
    assert client.delete(f"/api/v1/rbac/roles/{rid}", headers=h).status_code == 200

    clash = client.post(
        "/api/v1/rbac/roles", json={"name": "Q6 Reserved", "description": "probe"}, headers=h
    )
    assert clash.status_code == 409, clash.text

    restored = client.post(f"/api/v1/rbac/roles/{rid}/restore", headers=h)
    assert restored.status_code == 200, restored.text
    assert restored.json()["is_archived"] is False
    record_coverage("test_q6_role_name_reserved_after_archive", [COVERED[10]])


def test_q7_rehire_and_single_active_guard(client, factory):
    """Q7: rehire = new row, same person; no second active employment."""
    h = _sa(factory)["headers"]
    actor = factory.actor("q7rh")
    emp_id = actor["employment_id"]
    person_id = db_scalar(
        client, select(Employment.person_id).where(Employment.id == emp_id)
    )

    # Second active employment for the same person is refused.
    dup = client.post(
        "/api/v1/workforce/employments",
        json={
            "person_id": person_id,
            "employee_code": "EMP-Q7-DUP",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-07-01",
        },
        headers=h,
    )
    assert dup.status_code == 409, dup.text

    separated = client.post(
        f"/api/v1/workforce/employments/{emp_id}/state",
        json={"new_state": "RESIGNED", "effective_date": "2024-08-01"},
        headers=h,
    )
    assert separated.status_code == 200, separated.text

    rehired = client.post(
        f"/api/v1/workforce/employments/{emp_id}/rehire",
        json={
            "employee_code": "EMP-Q7-RE",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-09-01",
        },
        headers=h,
    )
    assert rehired.status_code == 201, rehired.text
    assert rehired.json()["person"]["id"] == person_id
    assert rehired.json()["id"] != emp_id
    record_coverage("test_q7_rehire_and_single_active_guard", [COVERED[2]])


def test_q8_attendance_unlock_and_paid_block(client, factory):
    """Q8: locked months reopen with audit; PAID months stay immutable."""
    h = _sa(factory)["headers"]
    actor = factory.actor("q8ul")
    emp_id = actor["employment_id"]
    grant(client, h, emp_id, "attendance", "CREATE", "SELF", "Q8 Att Create")

    punch = client.post(
        "/api/v1/workforce/attendance/punch",
        json={"employment_id": emp_id, "punch_type": "CHECK_IN"},
        headers=actor["headers"],
    )
    assert punch.status_code in (200, 201), punch.text

    assert client.post(
        f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/11/rebuild", headers=h
    ).status_code in (200, 201)
    assert client.post(
        f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/11/lock", headers=h
    ).status_code == 200

    unlocked = client.post(
        f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/11/unlock", headers=h
    )
    assert unlocked.status_code == 200, unlocked.text
    assert unlocked.json()["is_locked"] is False

    # PAID month cannot be reopened.
    client.post(
        "/api/v1/payroll/salaries",
        json={
            "employment_id": emp_id,
            "effective_from": "2026-01-01",
            "gross_salary": "50000.00",
            "items": [{"name": "Basic", "type": "EARNING", "amount": "50000.00"}],
        },
        headers=h,
    )
    calc = client.post(
        "/api/v1/payroll/calculate",
        json={"employment_id": emp_id, "year": 2026, "month": 11},
        headers=h,
    )
    assert calc.status_code == 201, calc.text
    pid = calc.json()["id"]
    assert client.post(f"/api/v1/payroll/{pid}/approve", headers=h).status_code == 200
    paid = client.post(
        f"/api/v1/payroll/{pid}/pay",
        json={"payment_method": "BANK_TRANSFER", "payment_reference": "Q8-001"},
        headers=h,
    )
    assert paid.status_code == 200, paid.text

    locked = client.get(
        f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/11", headers=h
    )
    assert locked.status_code == 200 and locked.json()["is_locked"] is True

    reopen_paid = client.post(
        f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/11/unlock", headers=h
    )
    assert reopen_paid.status_code in (400, 422), reopen_paid.text
    record_coverage("test_q8_attendance_unlock_and_paid_block", [COVERED[7]])


def test_q11_bulk_run_does_real_work(client, factory):
    """Q11: POST /payroll/run without employment_id processes the batch."""
    h = _sa(factory)["headers"]
    actor = factory.actor("q11b")
    client.post(
        "/api/v1/payroll/salaries",
        json={
            "employment_id": actor["employment_id"],
            "effective_from": "2026-01-01",
            "gross_salary": "40000.00",
            "items": [{"name": "Basic", "type": "EARNING", "amount": "40000.00"}],
        },
        headers=h,
    )
    run = client.post("/api/v1/payroll/run", json={"year": 2026, "month": 12}, headers=h)
    assert run.status_code == 200, run.text
    assert "succeeded" in run.json()["message"]
    record_coverage("test_q11_bulk_run_does_real_work", [COVERED[8]])


def test_q12_lead_won_opt_in_project(client, factory):
    """Q12: WON always converts Client; Project only when opted in."""
    h = _sa(factory)["headers"]
    lead = client.post(
        "/api/v1/sales/leads",
        json={"lead_title": "Q12 deal", "contact_name": "Q12 Buyer"},
        headers=h,
    )
    assert lead.status_code in (200, 201), lead.text
    lid = lead.json()["id"]
    assert lead.json().get("auto_create_project") is False

    won = client.post(f"/api/v1/sales/leads/{lid}/status", json={"status": "WON"}, headers=h)
    assert won.status_code == 200, won.text
    assert won.json()["client_id"] is not None
    assert won.json().get("project_id") is None

    lead2 = client.post(
        "/api/v1/sales/leads",
        json={"lead_title": "Q12 deal 2", "contact_name": "Q12 Buyer 2"},
        headers=h,
    )
    lid2 = lead2.json()["id"]
    won2 = client.post(
        f"/api/v1/sales/leads/{lid2}/status",
        json={"status": "WON", "auto_create_project": True},
        headers=h,
    )
    assert won2.status_code == 200, won2.text
    assert won2.json().get("project_id") is not None
    record_coverage("test_q12_lead_won_opt_in_project", [COVERED[9]])


def test_q16_department_restore_and_clash(client, factory):
    """Q16: restore works; restore fails 409 when the name is taken."""
    h = _sa(factory)["headers"]
    created = client.post(
        "/api/v1/workforce/departments", json={"name": "Q16 Restore Me"}, headers=h
    )
    assert created.status_code == 201, created.text
    did = created.json()["id"]
    assert client.delete(f"/api/v1/workforce/departments/{did}", headers=h).status_code == 200

    restored = client.post(f"/api/v1/workforce/departments/{did}/restore", headers=h)
    assert restored.status_code == 200, restored.text
    assert restored.json()["is_archived"] is False

    # Name taken by an active row -> restore is a 409.
    assert client.delete(f"/api/v1/workforce/departments/{did}", headers=h).status_code == 200
    taken = client.post(
        "/api/v1/workforce/departments", json={"name": "Q16 Restore Me"}, headers=h
    )
    assert taken.status_code == 201, taken.text
    clash = client.post(f"/api/v1/workforce/departments/{did}/restore", headers=h)
    assert clash.status_code == 409, clash.text

    # Archived detail visible on opt-in (Q15), hidden by default.
    assert client.get(f"/api/v1/workforce/departments/{did}", headers=h).status_code == 404
    opt_in = client.get(
        f"/api/v1/workforce/departments/{did}",
        params={"include_archived": True},
        headers=h,
    )
    assert opt_in.status_code == 200 and opt_in.json()["is_archived"] is True
    record_coverage("test_q16_department_restore_and_clash", [COVERED[3]])
