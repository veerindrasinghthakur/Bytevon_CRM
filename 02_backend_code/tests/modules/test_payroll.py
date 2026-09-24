"""Phase 4: payroll dashboard, salaries, runs, history."""
from __future__ import annotations

from tests.modules.helpers import grant, record_coverage

COVERED = [
    ("GET", "/api/v1/payroll/kpis"),
    ("GET", "/api/v1/payroll/period"),
    ("GET", "/api/v1/payroll/activity"),
    ("GET", "/api/v1/payroll/monthly-summary"),
    ("GET", "/api/v1/payroll/employees"),
    ("POST", "/api/v1/payroll/bank-accounts"),
    ("GET", "/api/v1/payroll/bank-accounts/{employment_id}"),
    ("GET", "/api/v1/payroll/bank-accounts/{employment_id}/primary"),
    ("GET", "/api/v1/payroll/history"),
    ("GET", "/api/v1/payroll/run/checks"),
    ("GET", "/api/v1/payroll/run/preview"),
    ("POST", "/api/v1/payroll/run"),
    ("POST", "/api/v1/payroll/salaries"),
    ("GET", "/api/v1/payroll/salaries/current/{employment_id}"),
    ("GET", "/api/v1/payroll/salaries/{employment_id}"),
    ("POST", "/api/v1/payroll/calculate"),
    ("GET", "/api/v1/payroll"),
    ("POST", "/api/v1/payroll/{payroll_id}/approve"),
    ("POST", "/api/v1/payroll/{payroll_id}/pay"),
    ("GET", "/api/v1/payroll/{payroll_id}"),
]


def _sa(factory):
    return factory.super_admin()


def _salary_for(client, h, emp_id):
    resp = client.post(
        "/api/v1/payroll/salaries",
        json={
            "employment_id": emp_id,
            "effective_from": "2026-01-01",
            "gross_salary": "80000.00",
            "items": [{"name": "Basic", "type": "EARNING", "amount": "80000.00"}],
        },
        headers=h,
    )
    assert resp.status_code in (200, 201), resp.text
    return resp.json()


def test_payroll_reads_and_bank_accounts(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("prl")
    emp_id = actor["employment_id"]
    grant(client, h, emp_id, "salary", "VIEW", "SELF", "Salary Self View")
    ah = actor["headers"]

    assert client.get("/api/v1/payroll/kpis", headers=h).status_code == 200
    assert client.get("/api/v1/payroll/period", headers=h).status_code == 200
    assert client.get("/api/v1/payroll/activity", headers=h).status_code == 200
    assert client.get("/api/v1/payroll/monthly-summary", headers=h).status_code == 200
    emps = client.get("/api/v1/payroll/employees", headers=h)
    assert emps.status_code == 200, emps.text

    bank = client.post(
        "/api/v1/payroll/bank-accounts",
        json={
            "employment_id": emp_id,
            "account_holder_name": "Test User",
            "bank_name": "Test Bank",
            "account_number": "1234567890",
            "ifsc_code": "TEST0001234",
            "account_type": "SAVINGS",
            "is_primary": True,
        },
        headers=h,
    )
    assert bank.status_code == 201, bank.text

    listed = client.get(f"/api/v1/payroll/bank-accounts/{emp_id}", headers=ah)
    assert listed.status_code == 200, listed.text
    assert len(listed.json()) >= 1

    primary = client.get(f"/api/v1/payroll/bank-accounts/{emp_id}/primary", headers=ah)
    assert primary.status_code == 200, primary.text

    hist = client.get("/api/v1/payroll/history", headers=h)
    assert hist.status_code == 200, hist.text
    record_coverage("test_payroll_reads_and_bank_accounts", COVERED[:9])


def test_payroll_calculate_approve_pay(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("prl2")
    emp_id = actor["employment_id"]
    _salary_for(client, h, emp_id)

    assert client.get("/api/v1/payroll/run/checks", headers=h).status_code == 200
    preview = client.get(
        "/api/v1/payroll/run/preview",
        params={"employment_id": emp_id, "year": 2026, "month": 9},
        headers=h,
    )
    assert preview.status_code == 200, preview.text

    run = client.post(
        "/api/v1/payroll/run",
        json={"employment_id": emp_id, "year": 2026, "month": 9},
        headers=h,
    )
    assert run.status_code in (200, 201, 202), run.text

    calc = client.post(
        "/api/v1/payroll/calculate",
        json={"employment_id": emp_id, "year": 2026, "month": 9},
        headers=h,
    )
    assert calc.status_code == 201, calc.text
    payroll_id = calc.json()["id"]

    listed = client.get("/api/v1/payroll", headers=h)
    assert listed.status_code == 200
    assert any(r["id"] == payroll_id for r in listed.json())

    got = client.get(f"/api/v1/payroll/{payroll_id}", headers=h)
    assert got.status_code == 200, got.text

    approved = client.post(f"/api/v1/payroll/{payroll_id}/approve", headers=h)
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "APPROVED"

    paid = client.post(
        f"/api/v1/payroll/{payroll_id}/pay",
        json={"payment_method": "BANK_TRANSFER", "payment_reference": "REF-001"},
        headers=h,
    )
    assert paid.status_code == 200, paid.text
    assert paid.json()["status"] == "PAID"

    current = client.get(f"/api/v1/payroll/salaries/current/{emp_id}", headers=h)
    assert current.status_code == 200, current.text
    record_coverage("test_payroll_calculate_approve_pay", COVERED[9:])


def _salary_payload(emp_id, effective_from="2026-01-01", gross="80000.00", items=None):
    return {
        "employment_id": emp_id,
        "effective_from": effective_from,
        "gross_salary": gross,
        "items": items
        if items is not None
        else [{"name": "Basic", "type": "EARNING", "amount": gross}],
    }


def test_salary_versioning_guards(client, factory):
    h = _sa(factory)["headers"]
    emp_id = factory.actor("ver1")["employment_id"]
    base = "/api/v1/payroll/salaries"

    first = client.post(base, json=_salary_payload(emp_id), headers=h)
    assert first.status_code == 201, first.text

    # Backdated / same-day start is rejected, not silently skipped.
    backdated = client.post(
        base, json=_salary_payload(emp_id, effective_from="2025-06-01"), headers=h
    )
    assert backdated.status_code == 400, backdated.text
    same_day = client.post(base, json=_salary_payload(emp_id), headers=h)
    assert same_day.status_code == 400, same_day.text

    # Gross must reconcile with EARNING items.
    mismatch = client.post(
        base,
        json=_salary_payload(
            emp_id,
            effective_from="2026-06-01",
            gross="90000.00",
            items=[{"name": "Basic", "type": "EARNING", "amount": "80000.00"}],
        ),
        headers=h,
    )
    assert mismatch.status_code == 400, mismatch.text

    # Strictly-later version closes the previous one.
    second = client.post(
        base, json=_salary_payload(emp_id, effective_from="2026-06-01"), headers=h
    )
    assert second.status_code == 201, second.text
    versions = client.get(f"{base}/{emp_id}", headers=h)
    assert versions.status_code == 200, versions.text
    rows = versions.json()
    assert len(rows) == 2
    assert rows[0]["effective_from"] >= rows[1]["effective_from"]
    assert rows[1]["effective_to"] == "2026-05-31"


def test_salaries_unconfigured_picker(client, factory):
    h = _sa(factory)["headers"]
    fresh = factory.actor("unconf")["employment_id"]
    configured = factory.actor("conf")["employment_id"]
    _salary_for(client, h, configured)

    resp = client.get("/api/v1/payroll/salaries/unconfigured", headers=h)
    assert resp.status_code == 200, resp.text
    ids = resp.json()
    assert fresh in ids
    assert configured not in ids
