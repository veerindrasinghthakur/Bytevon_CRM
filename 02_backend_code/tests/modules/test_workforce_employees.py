"""Phase 4: workforce employees — persons, positions, employments."""
from __future__ import annotations

from sqlalchemy import select

from app.modules.auth.models import Person
from app.modules.workforce.models import Employment, Position
from tests.modules.helpers import db_scalar, record_coverage, table_count

COVERED = [
    ("POST", "/api/v1/workforce/persons"),
    ("GET", "/api/v1/workforce/persons"),
    ("GET", "/api/v1/workforce/persons/{person_id}"),
    ("PATCH", "/api/v1/workforce/persons/{person_id}"),
    ("POST", "/api/v1/workforce/positions"),
    ("GET", "/api/v1/workforce/positions"),
    ("GET", "/api/v1/workforce/positions/{position_id}"),
    ("PATCH", "/api/v1/workforce/positions/{position_id}"),
    ("POST", "/api/v1/workforce/positions/{position_id}/archive"),
    ("POST", "/api/v1/workforce/employees"),
    ("POST", "/api/v1/workforce/employments"),
    ("GET", "/api/v1/workforce/employments"),
    ("GET", "/api/v1/workforce/employments/by-person/{person_id}"),
    ("GET", "/api/v1/workforce/employments/{employment_id}"),
    ("PATCH", "/api/v1/workforce/employments/{employment_id}"),
]


def _sa(factory):
    return factory.super_admin()


def test_person_lifecycle(client, factory):
    h = _sa(factory)["headers"]
    before = table_count(client, "persons")
    created = client.post(
        "/api/v1/workforce/persons",
        json={"first_name": "Test", "last_name": "Person"},
        headers=h,
    )
    assert created.status_code == 201, created.text
    pid = created.json()["id"]
    assert table_count(client, "persons") == before + 1
    assert db_scalar(client, select(Person.first_name).where(Person.id == pid)) == "Test"

    listed = client.get("/api/v1/workforce/persons", headers=h)
    assert listed.status_code == 200
    assert any(r["id"] == pid for r in listed.json())

    got = client.get(f"/api/v1/workforce/persons/{pid}", headers=h)
    assert got.status_code == 200
    assert got.json()["last_name"] == "Person"

    updated = client.patch(
        f"/api/v1/workforce/persons/{pid}",
        json={"last_name": "Renamed"},
        headers=h,
    )
    assert updated.status_code == 200, updated.text
    assert db_scalar(client, select(Person.last_name).where(Person.id == pid)) == "Renamed"

    missing = client.get("/api/v1/workforce/persons/999999", headers=h)
    assert missing.status_code == 404
    record_coverage("test_person_lifecycle", COVERED[:4])


def test_position_lifecycle(client, factory):
    h = _sa(factory)["headers"]
    created = client.post(
        "/api/v1/workforce/positions", json={"name": "QA Engineer"}, headers=h
    )
    assert created.status_code == 201, created.text
    pos_id = created.json()["id"]
    assert db_scalar(client, select(Position.name).where(Position.id == pos_id)) == "QA Engineer"

    listed = client.get("/api/v1/workforce/positions", headers=h)
    assert listed.status_code == 200
    assert any(r["id"] == pos_id for r in listed.json())

    got = client.get(f"/api/v1/workforce/positions/{pos_id}", headers=h)
    assert got.status_code == 200

    updated = client.patch(
        f"/api/v1/workforce/positions/{pos_id}",
        json={"name": "Senior QA Engineer"},
        headers=h,
    )
    assert updated.status_code == 200, updated.text
    assert (
        db_scalar(client, select(Position.name).where(Position.id == pos_id))
        == "Senior QA Engineer"
    )

    archived = client.post(
        f"/api/v1/workforce/positions/{pos_id}/archive", headers=h
    )
    assert archived.status_code == 200, archived.text
    assert db_scalar(client, select(Position.is_archived).where(Position.id == pos_id)) is True
    record_coverage("test_position_lifecycle", COVERED[4:9])


def test_employment_lifecycle(client, factory):
    h = _sa(factory)["headers"]
    person = client.post(
        "/api/v1/workforce/persons",
        json={"first_name": "Emp", "last_name": "Loyee"},
        headers=h,
    ).json()
    before = table_count(client, "employments")
    created = client.post(
        "/api/v1/workforce/employments",
        json={
            "person_id": person["id"],
            "employee_code": "EMP-T100",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-02-01",
        },
        headers=h,
    )
    assert created.status_code == 201, created.text
    emp_id = created.json()["id"]
    assert table_count(client, "employments") == before + 1

    one_shot = client.post(
        "/api/v1/workforce/employees",
        json={
            "first_name": "One",
            "last_name": "Shot",
            "employee_code": "EMP-T101",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-03-01",
        },
        headers=h,
    )
    assert one_shot.status_code == 201, one_shot.text
    assert table_count(client, "employments") == before + 2

    listed = client.get("/api/v1/workforce/employments", headers=h)
    assert listed.status_code == 200
    assert len(listed.json()) >= 2

    by_person = client.get(
        f"/api/v1/workforce/employments/by-person/{person['id']}", headers=h
    )
    assert by_person.status_code == 200
    assert any(r["id"] == emp_id for r in by_person.json())

    got = client.get(f"/api/v1/workforce/employments/{emp_id}", headers=h)
    assert got.status_code == 200
    assert got.json()["employee_code"] == "EMP-T100"

    updated = client.patch(
        f"/api/v1/workforce/employments/{emp_id}",
        json={"employment_type": "PART_TIME"},
        headers=h,
    )
    assert updated.status_code == 200, updated.text
    assert (
        db_scalar(
            client,
            select(Employment.employment_type).where(Employment.id == emp_id),
        ).value
        == "PART_TIME"
    )
    record_coverage("test_employment_lifecycle", COVERED[9:])
