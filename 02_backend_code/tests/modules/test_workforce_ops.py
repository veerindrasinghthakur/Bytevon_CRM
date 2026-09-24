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
    ("GET", "/api/v1/workforce/attendance/today"),
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

    # Q3 guard: remove closes the assignment with effective_to=today, which
    # still counts as active (>= today), so deleting the just-used
    # department correctly returns 409. Delete a fresh department instead.
    guarded = client.delete(
        f"/api/v1/workforce/departments/{dept_id}", headers=h
    )
    assert guarded.status_code == 409, guarded.text

    deletable = client.post(
        "/api/v1/workforce/departments", json={"name": "Research Deletable"}, headers=h
    )
    assert deletable.status_code == 201, deletable.text
    deletable_id = deletable.json()["id"]

    deleted = client.delete(
        f"/api/v1/workforce/departments/{deletable_id}", headers=h
    )
    assert deleted.status_code == 200, deleted.text
    assert (
        db_scalar(client, select(Department.is_archived).where(Department.id == deletable_id))
        is True
    )
    # Deleted rows excluded from normal list
    relisted = client.get("/api/v1/workforce/departments", headers=h).json()
    relisted_rows = relisted["items"] if isinstance(relisted, dict) else relisted
    assert all(r["id"] != deletable_id for r in relisted_rows)
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


def test_position_department_link(client, factory):
    """Positions belong to a department; listings scope by department_id."""
    h = _sa(factory)["headers"]
    hr = client.post("/api/v1/workforce/departments", json={"name": "HR Link"}, headers=h)
    assert hr.status_code == 201, hr.text
    hr_id = hr.json()["id"]
    eng = client.post("/api/v1/workforce/departments", json={"name": "Eng Link"}, headers=h)
    assert eng.status_code == 201, eng.text
    eng_id = eng.json()["id"]

    scoped = client.post(
        "/api/v1/workforce/positions",
        json={"name": "HR Partner", "department_id": hr_id},
        headers=h,
    )
    assert scoped.status_code == 201, scoped.text
    assert scoped.json()["department_id"] == hr_id

    free = client.post(
        "/api/v1/workforce/positions", json={"name": "Floater"}, headers=h
    )
    assert free.status_code == 201, free.text
    assert free.json()["department_id"] is None

    bad = client.post(
        "/api/v1/workforce/positions",
        json={"name": "Ghost", "department_id": 999999},
        headers=h,
    )
    assert bad.status_code == 404, bad.text

    def ids(params=None):
        res = client.get("/api/v1/workforce/positions", params=params or {}, headers=h)
        assert res.status_code == 200, res.text
        data = res.json()
        rows = data if isinstance(data, list) else data.get("items", [])
        return {r["id"] for r in rows}

    hr_rows = ids({"department_id": hr_id})
    assert scoped.json()["id"] in hr_rows  # own dept row
    assert free.json()["id"] in hr_rows  # unassigned legacy rows shown for all
    assert ids({"department_id": eng_id }) == {free.json()["id"]}

    moved = client.patch(
        f"/api/v1/workforce/positions/{scoped.json()['id']}",
        json={"department_id": eng_id},
        headers=h,
    )
    assert moved.status_code == 200, moved.text
    assert moved.json()["department_id"] == eng_id
    assert scoped.json()["id"] not in ids({"department_id": hr_id})
    assert scoped.json()["id"] in ids({"department_id": eng_id})

    cleared = client.patch(
        f"/api/v1/workforce/positions/{scoped.json()['id']}",
        json={"department_id": None},
        headers=h,
    )
    assert cleared.status_code == 200, cleared.text
    assert cleared.json()["department_id"] is None
    record_coverage("test_position_department_link", COVERED[9:14])


def test_department_member_names_and_head(client, factory):
    """Member rows carry person names (not codes); head name resolves."""
    h = _sa(factory)["headers"]
    dept = client.post("/api/v1/workforce/departments", json={"name": "Named Dept"}, headers=h)
    assert dept.status_code == 201, dept.text
    dept_id = dept.json()["id"]

    member = factory.actor("named")
    assigned = client.post(
        f"/api/v1/workforce/departments/{dept_id}/assign",
        json={"employmentId": member["employment_id"]},
        headers=h,
    )
    assert assigned.status_code == 200, assigned.text

    staff = client.get(f"/api/v1/workforce/departments/{dept_id}/employees", headers=h)
    assert staff.status_code == 200, staff.text
    rows = staff.json()["items"] if isinstance(staff.json(), dict) else staff.json()
    mine = next(r for r in rows if r["employmentId"] == member["employment_id"])
    assert mine["employeeCode"] == member["code"]
    assert mine["name"] != member["code"], mine
    assert "@" not in mine["name"] and " " in mine["name"], mine

    avail = client.get(
        f"/api/v1/workforce/departments/{dept_id}/employees-available", headers=h
    )
    assert avail.status_code == 200, avail.text
    labels = [o["label"] for o in avail.json()]
    assert labels, "expected candidates outside the department"
    assert all("(" in label and ")" in label for label in labels), labels

    patched = client.patch(
        f"/api/v1/workforce/departments/{dept_id}",
        json={"department_head_employment_id": member["employment_id"]},
        headers=h,
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["headName"] not in (None, "", "—"), patched.json()

    got = client.get(f"/api/v1/workforce/departments/{dept_id}", headers=h)
    assert got.status_code == 200, got.text
    assert got.json()["headName"] == patched.json()["headName"]
    record_coverage("test_department_member_names_and_head", COVERED[:9])


def test_employment_detail_and_list_enriched(client, factory):
    """Employment detail + list carry person/assignment display names."""
    h = _sa(factory)["headers"]
    dept = client.post("/api/v1/workforce/departments", json={"name": "Enriched Dept"}, headers=h)
    assert dept.status_code == 201, dept.text
    dept_id = dept.json()["id"]

    member = factory.actor("enr")
    assert (
        client.post(
            f"/api/v1/workforce/departments/{dept_id}/assign",
            json={"employmentId": member["employment_id"]},
            headers=h,
        ).status_code
        == 200
    )

    detail = client.get(
        f"/api/v1/workforce/employments/{member['employment_id']}", headers=h
    )
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["person_name"] not in (None, ""), body
    assert " " in body["person_name"], body
    assert body["department_id"] == dept_id, body
    assert body["department_name"] == "Enriched Dept", body

    listed = client.get("/api/v1/workforce/employments", headers=h)
    assert listed.status_code == 200, listed.text
    rows = listed.json() if isinstance(listed.json(), list) else listed.json().get("items", [])
    mine = next(r for r in rows if r["id"] == member["employment_id"])
    assert mine["person_name"] == body["person_name"], mine
    assert mine["department_name"] == "Enriched Dept", mine

    depts = client.get("/api/v1/workforce/departments", headers=h)
    assert depts.status_code == 200, depts.text
    assert depts.json()["metrics"]["staffing"] >= 1, depts.json()["metrics"]
    record_coverage("test_employment_detail_and_list_enriched", COVERED[9:14])


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


def test_attendance_today_and_manual_correction(client, factory):
    """Org today-list is name-enriched; manual entry auto-creates the own day."""
    import datetime as _dt

    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("att2")
    emp_id = actor["employment_id"]
    grant(client, h, emp_id, "attendance", "CREATE", "SELF", "Att Self Create")
    grant(client, h, emp_id, "attendance", "VIEW", "ORGANIZATION", "Att Org View")
    b_headers = actor["headers"]

    punch = client.post(
        "/api/v1/workforce/attendance/punch",
        json={"employment_id": emp_id, "punch_type": "CHECK_IN"},
        headers=b_headers,
    )
    assert punch.status_code == 201, punch.text

    today = client.get("/api/v1/workforce/attendance/today", headers=b_headers)
    assert today.status_code == 200, today.text
    payload = today.json()
    assert payload["total"] >= 1
    mine = [r for r in payload["items"] if r["id"] == str(punch.json()["attendance_day_id"])]
    assert mine, payload["items"]
    assert mine[0]["name"] and mine[0]["name"] != f"Emp #{emp_id}"
    assert mine[0]["status"] == "PRESENT"

    manual = factory.actor("att3")
    grant(client, h, manual["employment_id"], "attendance", "CREATE", "SELF", "Att Self Create")
    created = client.post(
        "/api/v1/workforce/attendance/corrections",
        json={
            "attendance_date": _dt.date.today().isoformat(),
            "requested_check_in": f"{_dt.date.today().isoformat()}T09:00:00+00:00",
            "requested_check_out": f"{_dt.date.today().isoformat()}T18:00:00+00:00",
            "reason": "[Client Meeting] off-site, no connectivity",
        },
        headers=manual["headers"],
    )
    assert created.status_code == 201, created.text
    assert created.json()["approval_request_id"] is not None

    invalid = client.post(
        "/api/v1/workforce/attendance/corrections",
        json={"reason": "missing day reference"},
        headers=manual["headers"],
    )
    assert invalid.status_code == 422, invalid.text
    record_coverage(
        "test_attendance_today_and_manual_correction",
        [("GET", "/api/v1/workforce/attendance/today"), ("POST", "/api/v1/workforce/attendance/corrections")],
    )
