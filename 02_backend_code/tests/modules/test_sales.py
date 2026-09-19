"""Phase 4: sales leads, clients, sources, analytics."""
from __future__ import annotations

from sqlalchemy import select

from app.modules.sales.models import Client, Lead
from tests.modules.helpers import db_scalar, record_coverage, table_count

COVERED = [
    ("GET", "/api/v1/sales/leads/filter-options"),
    ("GET", "/api/v1/sales/meta/lead-filter-options"),
    ("GET", "/api/v1/sales/clients/filter-options"),
    ("GET", "/api/v1/sales/meta/client-filter-options"),
    ("GET", "/api/v1/sales/sales-representatives"),
    ("POST", "/api/v1/sales/leads"),
    ("GET", "/api/v1/sales/leads"),
    ("GET", "/api/v1/sales/leads/{lead_id}"),
    ("PATCH", "/api/v1/sales/leads/{lead_id}"),
    ("POST", "/api/v1/sales/leads/{lead_id}/status"),
    ("POST", "/api/v1/sales/clients"),
    ("GET", "/api/v1/sales/clients"),
    ("GET", "/api/v1/sales/clients/{client_id}"),
    ("PATCH", "/api/v1/sales/clients/{client_id}"),
    ("POST", "/api/v1/sales/clients/{client_id}/archive"),
    ("GET", "/api/v1/sales/clients/{client_id}/contacts"),
    ("POST", "/api/v1/sales/clients/{client_id}/contacts"),
    ("POST", "/api/v1/sales/sources"),
    ("GET", "/api/v1/sales/sources"),
    ("GET", "/api/v1/sales/sources/{source_id}"),
    ("PATCH", "/api/v1/sales/sources/{source_id}"),
    ("POST", "/api/v1/sales/sources/{source_id}/archive"),
    ("POST", "/api/v1/sales/platforms"),
    ("GET", "/api/v1/sales/platforms"),
    ("GET", "/api/v1/sales/activity"),
    ("GET", "/api/v1/sales/case-studies"),
    ("POST", "/api/v1/sales/case-studies"),
    ("GET", "/api/v1/sales/dashboard"),
    ("GET", "/api/v1/sales/analytics"),
    ("GET", "/api/v1/sales/metrics/dashboard"),
]


def _sa(factory):
    return factory.super_admin()


def test_sales_filters_and_reps(client, factory):
    h = _sa(factory)["headers"]
    for path in (
        "/api/v1/sales/leads/filter-options",
        "/api/v1/sales/meta/lead-filter-options",
        "/api/v1/sales/clients/filter-options",
        "/api/v1/sales/meta/client-filter-options",
    ):
        resp = client.get(path, headers=h)
        assert resp.status_code == 200, (path, resp.text)
    reps = client.get("/api/v1/sales/sales-representatives", headers=h)
    assert reps.status_code == 200, reps.text
    record_coverage("test_sales_filters_and_reps", COVERED[:5])


def test_lead_lifecycle(client, factory):
    h = _sa(factory)["headers"]
    actor = factory.actor("sls")
    before = table_count(client, "leads")
    created = client.post(
        "/api/v1/sales/leads",
        json={
            "lead_title": "Acme Expansion",
            "contact_name": "Jane Buyer",
            "email": "jane@acme.example",
            "assigned_employment_id": actor["employment_id"],
        },
        headers=h,
    )
    assert created.status_code == 201, created.text
    lead_id = created.json()["id"]
    assert table_count(client, "leads") == before + 1

    listed = client.get("/api/v1/sales/leads", headers=h)
    assert listed.status_code == 200
    assert any(r["id"] == lead_id for r in listed.json())

    got = client.get(f"/api/v1/sales/leads/{lead_id}", headers=h)
    assert got.status_code == 200

    updated = client.patch(
        f"/api/v1/sales/leads/{lead_id}", json={"priority": "High"}, headers=h
    )
    assert updated.status_code == 200, updated.text
    assert (
        db_scalar(client, select(Lead.priority).where(Lead.id == lead_id)) == "High"
    )

    status = client.post(
        f"/api/v1/sales/leads/{lead_id}/status",
        json={"status": "CHAT_OPEN"},
        headers=h,
    )
    assert status.status_code == 200, status.text
    record_coverage("test_lead_lifecycle", COVERED[5:10])


def test_client_lifecycle_with_contacts(client, factory):
    h = _sa(factory)["headers"]
    before = table_count(client, "clients")
    created = client.post(
        "/api/v1/sales/clients",
        json={"client_type": "COMPANY", "client_name": "Globex", "country": "USA"},
        headers=h,
    )
    assert created.status_code == 201, created.text
    client_id = created.json()["id"]
    assert table_count(client, "clients") == before + 1

    listed = client.get("/api/v1/sales/clients", headers=h)
    assert listed.status_code == 200
    assert any(r["id"] == client_id for r in listed.json())

    got = client.get(f"/api/v1/sales/clients/{client_id}", headers=h)
    assert got.status_code == 200

    updated = client.patch(
        f"/api/v1/sales/clients/{client_id}", json={"city": "Boston"}, headers=h
    )
    assert updated.status_code == 200, updated.text
    assert (
        db_scalar(client, select(Client.city).where(Client.id == client_id)) == "Boston"
    )

    contact = client.post(
        f"/api/v1/sales/clients/{client_id}/contacts",
        json={"client_id": client_id, "name": "Hank Scorpio", "email": "hank@globex.example"},
        headers=h,
    )
    assert contact.status_code == 201, contact.text

    contacts = client.get(f"/api/v1/sales/clients/{client_id}/contacts", headers=h)
    assert contacts.status_code == 200
    assert len(contacts.json()) >= 1

    archived = client.post(
        f"/api/v1/sales/clients/{client_id}/archive", headers=h
    )
    assert archived.status_code == 200, archived.text
    record_coverage("test_client_lifecycle_with_contacts", COVERED[10:17])


def test_sources_platforms_analytics(client, factory):
    h = _sa(factory)["headers"]
    src = client.post(
        "/api/v1/sales/sources", json={"name": "Referral"}, headers=h
    )
    assert src.status_code == 201, src.text
    src_id = src.json()["id"]
    assert client.get("/api/v1/sales/sources", headers=h).status_code == 200
    assert client.get(f"/api/v1/sales/sources/{src_id}", headers=h).status_code == 200
    assert (
        client.patch(
            f"/api/v1/sales/sources/{src_id}", json={"description": "word of mouth"}, headers=h
        ).status_code
        == 200
    )
    assert (
        client.post(f"/api/v1/sales/sources/{src_id}/archive", headers=h).status_code
        == 200
    )
    plat = client.post(
        "/api/v1/sales/platforms", json={"name": "Web"}, headers=h
    )
    assert plat.status_code == 201, plat.text
    assert client.get("/api/v1/sales/platforms", headers=h).status_code == 200

    assert client.get("/api/v1/sales/activity", headers=h).status_code == 200
    cases = client.get("/api/v1/sales/case-studies", headers=h)
    assert cases.status_code == 200, cases.text
    created_case = client.post(
        "/api/v1/sales/case-studies", json={"title": "Win story"}, headers=h
    )
    assert created_case.status_code == 201, created_case.text
    assert client.get("/api/v1/sales/dashboard", headers=h).status_code == 200
    assert client.get("/api/v1/sales/analytics", headers=h).status_code == 200
    assert client.get("/api/v1/sales/metrics/dashboard", headers=h).status_code == 200
    record_coverage("test_sources_platforms_analytics", COVERED[17:])
