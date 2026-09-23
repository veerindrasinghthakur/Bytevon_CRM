"""Phase 4: admin masters, users, settings, audit."""
from __future__ import annotations

from sqlalchemy import select

from app.modules.admin.holiday_calendar.models import HolidayCalendar
from app.modules.admin.location.models import Location
from app.modules.admin.settings.models import OrganizationSettings
from app.modules.workforce.shift.models import Shift
from app.modules.admin.working_week.models import WorkingWeek
from tests.modules.helpers import db_scalar, record_coverage

COVERED = [
    ("POST", "/api/v1/admin/locations"),
    ("GET", "/api/v1/admin/locations"),
    ("GET", "/api/v1/admin/locations/{location_id}"),
    ("PATCH", "/api/v1/admin/locations/{location_id}"),
    ("POST", "/api/v1/admin/locations/{location_id}/archive"),
    ("POST", "/api/v1/workforce/shifts"),
    ("GET", "/api/v1/workforce/shifts"),
    ("GET", "/api/v1/workforce/shifts/{shift_id}"),
    ("PATCH", "/api/v1/workforce/shifts/{shift_id}"),
    ("POST", "/api/v1/workforce/shifts/{shift_id}/archive"),
    ("POST", "/api/v1/admin/working-weeks"),
    ("GET", "/api/v1/admin/working-weeks"),
    ("GET", "/api/v1/admin/working-weeks/current"),
    ("GET", "/api/v1/admin/working-weeks/{working_week_id}"),
    ("POST", "/api/v1/admin/working-weeks/{working_week_id}/archive"),
    ("POST", "/api/v1/admin/holiday-calendars"),
    ("GET", "/api/v1/admin/holiday-calendars"),
    ("GET", "/api/v1/admin/holiday-calendars/{calendar_id}"),
    ("PATCH", "/api/v1/admin/holiday-calendars/{calendar_id}"),
    ("POST", "/api/v1/admin/holiday-calendars/{calendar_id}/archive"),
    ("POST", "/api/v1/admin/holiday-calendars/{calendar_id}/holidays"),
    ("GET", "/api/v1/admin/holiday-calendars/{calendar_id}/holidays"),
    ("PATCH", "/api/v1/admin/holiday-calendars/holidays/{holiday_id}"),
    ("DELETE", "/api/v1/admin/holiday-calendars/holidays/{holiday_id}"),
    ("GET", "/api/v1/admin/settings"),
    ("PUT", "/api/v1/admin/settings"),
    ("PATCH", "/api/v1/admin/settings"),
    ("GET", "/api/v1/admin/users"),
    ("GET", "/api/v1/admin/employments-without-login"),
    ("GET", "/api/v1/admin/users/{login_id}"),
    ("POST", "/api/v1/admin/users"),
    ("PATCH", "/api/v1/admin/users/{login_id}"),
    ("POST", "/api/v1/admin/users/{login_id}/deactivate"),
    ("POST", "/api/v1/admin/users/{login_id}/activate"),
    ("POST", "/api/v1/admin/users/{login_id}/lock"),
    ("POST", "/api/v1/admin/users/{login_id}/unlock"),
    ("POST", "/api/v1/admin/users/{login_id}/archive"),
    ("DELETE", "/api/v1/admin/users/{login_id}"),
    ("POST", "/api/v1/admin/audit/logs"),
    ("GET", "/api/v1/admin/audit/logs"),
    ("GET", "/api/v1/admin/audit/logs/{log_id}"),
    ("POST", "/api/v1/admin/audit/archive"),
    ("POST", "/api/v1/audit/logs"),
    ("GET", "/api/v1/audit/logs"),
    ("GET", "/api/v1/audit/logs/{log_id}"),
    ("POST", "/api/v1/audit/archive"),
]


def _sa(factory):
    return factory.super_admin()


def test_admin_department_moved_to_workforce(client, factory):
    # Department ownership moved to Workforce; admin route must be gone.
    sa = _sa(factory)
    h = sa["headers"]
    assert client.get("/api/v1/admin/departments", headers=h).status_code == 404
    assert client.get("/api/v1/workforce/departments", headers=h).status_code == 200


def test_admin_location_shift_week_lifecycle(client, factory):
    h = _sa(factory)["headers"]
    loc = client.post(
        "/api/v1/admin/locations",
        json={
            "name": "Berlin Hub",
            "timezone": "Europe/Berlin",
            "latitude": "52.5200",
            "longitude": "13.4050",
            "attendance_radius_meters": 150,
            "country": "Germany",
            "state": "Berlin",
            "city": "Berlin",
            "address": "Unter den Linden 1",
            "currency": "EUR",
            "fiscal_year_start_month": 1,
        },
        headers=h,
    )
    assert loc.status_code == 201, loc.text
    loc_id = loc.json()["id"]
    assert client.get("/api/v1/admin/locations", headers=h).status_code == 200
    assert client.get(f"/api/v1/admin/locations/{loc_id}", headers=h).status_code == 200
    upd = client.patch(
        f"/api/v1/admin/locations/{loc_id}", json={"city": "Munich"}, headers=h
    )
    assert upd.status_code == 200, upd.text
    assert (
        db_scalar(client, select(Location.city).where(Location.id == loc_id)) == "Munich"
    )
    assert (
        client.post(f"/api/v1/admin/locations/{loc_id}/archive", headers=h).status_code
        == 200
    )

    shift = client.post(
        "/api/v1/workforce/shifts",
        json={"name": "Evening", "start_time": "14:00:00", "end_time": "22:00:00"},
        headers=h,
    )
    assert shift.status_code == 201, shift.text
    shift_id = shift.json()["id"]
    assert client.get("/api/v1/workforce/shifts", headers=h).status_code == 200
    assert client.get(f"/api/v1/workforce/shifts/{shift_id}", headers=h).status_code == 200
    assert (
        client.patch(
            f"/api/v1/workforce/shifts/{shift_id}", json={"grace_late_minutes": 10}, headers=h
        ).status_code
        == 200
    )
    assert (
        db_scalar(client, select(Shift.grace_late_minutes).where(Shift.id == shift_id))
        == 10
    )
    assert (
        client.post(f"/api/v1/workforce/shifts/{shift_id}/archive", headers=h).status_code
        == 200
    )

    ww = client.post(
        "/api/v1/admin/working-weeks",
        json={
            "name": "WW-Test",
            "working_days_of_week": [1, 2, 3, 4, 5],
            "effective_from": "2026-01-01",
        },
        headers=h,
    )
    assert ww.status_code == 201, ww.text
    ww_id = ww.json()["id"]
    assert client.get("/api/v1/admin/working-weeks", headers=h).status_code == 200
    assert (
        client.get("/api/v1/admin/working-weeks/current", headers=h).status_code == 200
    )
    assert (
        client.get(f"/api/v1/admin/working-weeks/{ww_id}", headers=h).status_code == 200
    )
    assert (
        db_scalar(client, select(WorkingWeek.name).where(WorkingWeek.id == ww_id))
        == "WW-Test"
    )
    assert (
        client.post(
            f"/api/v1/admin/working-weeks/{ww_id}/archive", headers=h
        ).status_code
        == 200
    )
    record_coverage("test_admin_location_shift_week_lifecycle", COVERED[9:24])


def test_admin_holiday_calendar_lifecycle(client, factory):
    h = _sa(factory)["headers"]
    cal = client.post(
        "/api/v1/admin/holiday-calendars", json={"name": "IN-2026"}, headers=h
    )
    assert cal.status_code == 201, cal.text
    cal_id = cal.json()["id"]
    assert client.get("/api/v1/admin/holiday-calendars", headers=h).status_code == 200
    assert (
        client.get(f"/api/v1/admin/holiday-calendars/{cal_id}", headers=h).status_code
        == 200
    )
    assert (
        client.patch(
            f"/api/v1/admin/holiday-calendars/{cal_id}", json={"name": "IN-2026-R1"}, headers=h
        ).status_code
        == 200
    )
    assert (
        db_scalar(
            client, select(HolidayCalendar.name).where(HolidayCalendar.id == cal_id)
        )
        == "IN-2026-R1"
    )
    hol = client.post(
        f"/api/v1/admin/holiday-calendars/{cal_id}/holidays",
        json={
            "name": "Diwali",
            "holiday_date": "2026-11-08",
            "is_optional": False,
        },
        headers=h,
    )
    assert hol.status_code == 201, hol.text
    hol_id = hol.json()["id"]
    listed = client.get(
        f"/api/v1/admin/holiday-calendars/{cal_id}/holidays", headers=h
    )
    assert listed.status_code == 200
    assert any(x["id"] == hol_id for x in listed.json())
    assert (
        client.patch(
            f"/api/v1/admin/holiday-calendars/holidays/{hol_id}",
            json={"name": "Deepavali"},
            headers=h,
        ).status_code
        == 200
    )
    assert (
        client.delete(
            f"/api/v1/admin/holiday-calendars/holidays/{hol_id}", headers=h
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/v1/admin/holiday-calendars/{cal_id}/archive", headers=h
        ).status_code
        == 200
    )
    record_coverage("test_admin_holiday_calendar_lifecycle", COVERED[24:33])


def test_admin_settings_and_users(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    put = client.put(
        "/api/v1/admin/settings",
        json={"company_name": "ByteVon Test"},
        headers=h,
    )
    assert put.status_code == 200, put.text
    got = client.get("/api/v1/admin/settings", headers=h)
    assert got.status_code == 200, got.text
    assert (
        db_scalar(client, select(OrganizationSettings.company_name)) == "ByteVon Test"
    )
    patched = client.patch(
        "/api/v1/admin/settings", json={"default_currency": "USD"}, headers=h
    )
    assert patched.status_code == 200, patched.text

    users = client.get("/api/v1/admin/users", headers=h)
    assert users.status_code == 200
    nologin = client.get("/api/v1/admin/employments-without-login", headers=h)
    assert nologin.status_code in (200, 404)

    person = client.post(
        "/api/v1/workforce/persons",
        json={"first_name": "No", "last_name": "Login"},
        headers=h,
    ).json()
    employment = client.post(
        "/api/v1/workforce/employments",
        json={
            "person_id": person["id"],
            "employee_code": "EMP-NOLOGIN",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-04-01",
        },
        headers=h,
    ).json()
    created = client.post(
        "/api/v1/admin/users",
        json={
            "employmentId": employment["id"],
            "email": "nologin.user@example.com",
            "temporaryPassword": "TempPass123!",
        },
        headers=h,
    )
    assert created.status_code == 201, created.text
    login_id = created.json()["id"]
    assert created.json()["employmentId"] == employment["id"]

    assert client.get(f"/api/v1/admin/users/{login_id}", headers=h).status_code == 200
    assert (
        client.patch(
            f"/api/v1/admin/users/{login_id}",
            json={"status": "ACTIVE"},
            headers=h,
        ).status_code
        == 200
    )
    assert (
        client.post(f"/api/v1/admin/users/{login_id}/deactivate", headers=h).status_code
        == 200
    )
    assert (
        client.post(f"/api/v1/admin/users/{login_id}/activate", headers=h).status_code
        == 200
    )
    assert (
        client.post(f"/api/v1/admin/users/{login_id}/lock", headers=h).status_code == 200
    )
    assert (
        client.post(f"/api/v1/admin/users/{login_id}/unlock", headers=h).status_code
        == 200
    )
    assert (
        client.delete(f"/api/v1/admin/users/{login_id}", headers=h).status_code
        == 200
    )
    # Soft-delete: login row remains with is_archived=true, excluded from lists
    from app.modules.auth.models import Login as _Login

    assert (
        db_scalar(client, select(_Login.is_archived).where(_Login.id == login_id))
        is True
    )
    listed_users = client.get("/api/v1/admin/users", headers=h).json()
    listed_items = listed_users["items"] if isinstance(listed_users, dict) else listed_users
    assert all(u["id"] != login_id for u in listed_items)
    assert client.get(f"/api/v1/admin/users/{login_id}", headers=h).status_code == 404
    person2 = client.post(
        "/api/v1/workforce/persons",
        json={"first_name": "Gone", "last_name": "Soon"},
        headers=h,
    ).json()
    employment2 = client.post(
        "/api/v1/workforce/employments",
        json={
            "person_id": person2["id"],
            "employee_code": "EMP-TODELETE",
            "employment_type": "FULL_TIME",
            "joining_date": "2024-05-01",
        },
        headers=h,
    ).json()
    created2 = client.post(
        "/api/v1/admin/users",
        json={
            "employmentId": employment2["id"],
            "email": "todelete.user@example.com",
            "temporaryPassword": "TempPass123!",
        },
        headers=h,
    )
    assert created2.status_code == 201, created2.text
    assert (
        client.delete(f"/api/v1/admin/users/{created2.json()['id']}", headers=h).status_code
        == 200
    )

    record_coverage("test_admin_settings_and_users", COVERED[33:])


def test_audit_endpoints(client, factory):
    h = _sa(factory)["headers"]
    for prefix in ("/api/v1/admin/audit", "/api/v1/audit"):
        created = client.post(
            f"{prefix}/logs",
            json={
                "reference_type": "EMPLOYMENT",
                "reference_id": 1,
                "action": "CREATE",
                "description": "probe log",
            },
            headers=h,
        )
        assert created.status_code == 201, (prefix, created.text)
        log_id = created.json()["id"]
        listed = client.get(f"{prefix}/logs", headers=h)
        assert listed.status_code == 200
        assert any(r["id"] == log_id for r in listed.json())
        got = client.get(f"{prefix}/logs/{log_id}", headers=h)
        assert got.status_code == 200, (prefix, got.text)
        archived = client.post(f"{prefix}/archive", headers=h)
        assert archived.status_code == 200, (prefix, archived.text)
    record_coverage("test_audit_endpoints", COVERED[52:])

