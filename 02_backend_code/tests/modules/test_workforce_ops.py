"""Phase 4: workforce departments + assignments + attendance ops."""
from __future__ import annotations

from sqlalchemy import select

from app.modules.workforce.department.models import Department
from tests.modules.helpers import db_scalar, grant, record_coverage, table_count

COVERED = [
    ("POST", "/api/v1/workforce/departments"),
    ("GET", "/api/v1/workforce/departments"),
    ("GET", "/api/v1/workforce/departments/{department_id}"),
    ("PATCH", "/api/v1/workforce/departments/{department_id}"),
    ("DELETE", "/api/v1/workforce/departments/{department_id}"),
    ("GET", "/api/v1/workforce/departments/{department_id}/employees"),
    ("GET", "/api/v1/workforce/departments/{department_id}/employees-available"),
    ("POST", "/api/v1/workforce/departments/{department_id}/assign"),
    ("POST", "/api/v1/workforce/departments/{department_id}/remove"),
    ("POST", "/api/v1/workforce/employments/{employment_id}/state"),
    ("GET", "/api/v1/workforce/employments/{employment_id}/state-history"),
    ("POST", "/api/v1/workforce/employments/{employment_id}/assignments"),
    ("GET", "/api/v1/workforce/employments/{employment_id}/assignments/current"),
    ("GET", "/api/v1/workforce/employments/{employment_id}/assignments"),
    ("POST", "/api/v1/workforce/positions"),
    ("GET", "/api/v1/workforce/positions"),
    ("GET", "/api/v1/workforce/positions/{position_id}"),
    ("PATCH", "/api/v1/workforce/positions/{position_id}"),
    ("DELETE", "/api/v1/workforce/positions/{position_id}"),
    ("POST", "/api/v1/workforce/attendance/punch"),
    ("GET", "/api/v1/workforce/attendance/days/{day_id}"),
    ("GET", "/api/v1/workforce/attendance/days/by-employment/{employment_id}"),
    ("POST", "/api/v1/workforce/attendance/corrections"),
    ("GET", "/api/v1/workforce/attendance/corrections/{correction_id}"),
    ("GET", "/api/v1/workforce/attendance/summaries/{employment_id}/{year}/{month}"),
    ("POST", "/api/v1/workforce/attendance/summaries/{employment_id}/{year}/{month}/rebuild"),
    ("POST", "/api/v1/workforce/attendance/summaries/{employment_id}/{year}/{month}/lock"),
    ("POST", "/api/v1/workforce/attendance/breaks/start"),
    ("POST", "/api/v1/workforce/attendance/breaks/{break_id}/end"),
]


def _sa(factory):
    return factory.super_admin()


def test_department_lifecycle(client, factory):
    h = _sa(factory)["headers"]
    actor = factory.actor("dept")
    before = table_count(client, "departments")
    created = client.post(
        "/api/v1/workforce/departments", json={"name": "Research"}, headers=h
    )
    assert created.status_code == 201, created.text
    dept_id = created.json()["id"]
    assert table_count(client, "departments") == before + 1

    listed = client.get("/api/v1/workforce/departments", headers=h)
    assert listed.status_code == 200
    payload = listed.json()
    rows = payload["items"] if isinstance(payload, dict) else payload
    assert any(r["id"] == dept_id for r in rows)
    if isinstance(payload, dict):
        assert "metrics" in payload and "total" in payload

    got = client.get(f"/api/v1/workforce/departments/{dept_id}", headers=h)
    assert got.status_code == 200

    updated = client.patch(
        f"/api/v1/workforce/departments/{dept_id}", json={"name": "R&D"}, headers=h
    )
    assert updated.status_code == 200, updated.text
    assert (
        db_scalar(client, select(Department.name).where(Department.id == dept_id))
        == "R&D"
    )

    emp_list = client.get(
        f"/api/v1/workforce/departments/{dept_id}/employees", headers=h
    )
    assert emp_list.status_code == 200

    avail = client.get(
        f"/api/v1/workforce/departments/{dept_id}/employees-available", headers=h
    )
    assert avail.status_code == 200, avail.text

    assigned = client.post(
        f"/api/v1/workforce/departments/{dept_id}/assign",
        json={"employmentId": actor["employment_id"]},
        headers=h,
    )
    assert assigned.status_code == 200, assigned.text

    removed = client.post(
        f"/api/v1/workforce/departments/{dept_id}/remove",
        json={"employmentId": actor["employment_id"]},
        headers=h,
    )
    assert removed.status_code == 200, removed.text

    deleted = client.delete(
        f"/api/v1/workforce/departments/{dept_id}", headers=h
    )
    assert deleted.status_code == 200, deleted.text
    assert (
        db_scalar(client, select(Department.is_archived).where(Department.id == dept_id))
        is True
    )
    # Deleted rows excluded from normal list
    relisted = client.get("/api/v1/workforce/departments", headers=h).json()
    relisted_rows = relisted["items"] if isinstance(relisted, dict) else relisted
    assert all(r["id"] != dept_id for r in relisted_rows)
    record_coverage("test_department_lifecycle", COVERED[:9])


def test_position_lifecycle(client, factory):
    from app.modules.workforce.models import Position

    h = _sa(factory)["headers"]
    created = client.post(
        "/api/v1/workforce/positions", json={"name": "QA Engineer"}, headers=h
    )
    assert created.status_code == 201, created.text
    pos_id = created.json()["id"]

    assert client.get("/api/v1/workforce/positions", headers=h).status_code == 200
    assert client.get(f"/api/v1/workforce/positions/{pos_id}", headers=h).status_code == 200
    updated = client.patch(
        f"/api/v1/workforce/positions/{pos_id}", json={"name": "Senior QA Engineer"}, headers=h
    )
    assert updated.status_code == 200, updated.text

    deleted = client.delete(f"/api/v1/workforce/positions/{pos_id}", headers=h)
    assert deleted.status_code == 200, deleted.text
    assert (
        db_scalar(client, select(Position.is_archived).where(Position.id == pos_id))
        is True
    )
    listed = client.get("/api/v1/workforce/positions", headers=h).json()
    rows = listed if isinstance(listed, list) else listed.get("items", [])
    assert all(r["id"] != pos_id for r in rows)
    record_coverage("test_position_lifecycle", COVERED[9:14])


def test_assignment_and_state_flow(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("asg")
    emp_id = actor["employment_id"]

    changed = client.post(
        f"/api/v1/workforce/employments/{emp_id}/state",
        json={"new_state": "PROBATION", "effective_date": "2024-06-01"},
        headers=h,
    )
    assert changed.status_code == 201, changed.text

    history = client.get(
        f"/api/v1/workforce/employments/{emp_id}/state-history", headers=h
    )
    assert history.status_code == 200
    assert len(history.json()) >= 1

    before = table_count(client, "employment_assignments")
    assignment = client.post(
        f"/api/v1/workforce/employments/{emp_id}/assignments",
        json={
            "work_mode": "OFFICE",
            "effective_from": "2024-06-01",
            "change_reason": "initial posting",
        },
        headers=h,
    )
    assert assignment.status_code == 201, assignment.text
    assert table_count(client, "employment_assignments") == before + 1

    current = client.get(
        f"/api/v1/workforce/employments/{emp_id}/assignments/current", headers=h
    )
    assert current.status_code == 200, current.text

    listed = client.get(
        f"/api/v1/workforce/employments/{emp_id}/assignments", headers=h
    )
    assert listed.status_code == 200
    assert len(listed.json()) >= 1
    record_coverage("test_assignment_and_state_flow", COVERED[9:14])


def test_attendance_ops_flow(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("att")
    emp_id = actor["employment_id"]
    grant(client, h, emp_id, "attendance", "CREATE", "SELF", "Att Self Create")
    b_headers = actor["headers"]
    # Punch own day as the owner (SELF grant-gated).
    punch = client.post(
        "/api/v1/workforce/attendance/punch",
        json={"employment_id": emp_id, "punch_type": "CHECK_IN"},
        headers=b_headers,
    )
    assert punch.status_code == 201, punch.text
    day_id = punch.json()["attendance_day_id"]

    got_day = client.get(f"/api/v1/workforce/attendance/days/{day_id}", headers=b_headers)
    assert got_day.status_code == 200, got_day.text

    by_emp = client.get(
        f"/api/v1/workforce/attendance/days/by-employment/{emp_id}", headers=b_headers
    )
    assert by_emp.status_code == 200
    assert len(by_emp.json()) >= 1

    correction = client.post(
        "/api/v1/workforce/attendance/corrections",
        json={
            "attendance_day_id": day_id,
            "requested_check_in": "2026-09-19T09:05:00+00:00",
            "reason": "forgot to punch",
        },
        headers=b_headers,
    )
    assert correction.status_code == 201, correction.text
    corr_id = correction.json()["id"]

    got_corr = client.get(
        f"/api/v1/workforce/attendance/corrections/{corr_id}", headers=b_headers
    )
    assert got_corr.status_code == 200, got_corr.text

    summary = client.get(
        f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/9", headers=b_headers
    )
    assert summary.status_code in (200, 404), summary.text
    if summary.status_code == 404:
        rebuilt = client.post(
            f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/9/rebuild",
            headers=h,
        )
        assert rebuilt.status_code == 200, rebuilt.text
        summary = client.get(
            f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/9", headers=b_headers
        )
        assert summary.status_code == 200, summary.text

    brk = client.post(
        "/api/v1/workforce/attendance/breaks/start",
        json={"attendance_day_id": day_id},
        headers=b_headers,
    )
    assert brk.status_code == 201, brk.text
    break_id = brk.json()["id"]

    end = client.post(
        f"/api/v1/workforce/attendance/breaks/{break_id}/end", json={}, headers=b_headers
    )
    assert end.status_code == 200, end.text

    locked = client.post(
        f"/api/v1/workforce/attendance/summaries/{emp_id}/2026/9/lock", headers=h
    )
    assert locked.status_code == 200, locked.text
    record_coverage("test_attendance_ops_flow", COVERED[14:])
