"""Phase 3 permanent regression: horizontal (owner vs non-owner) access.

Contract: personal-domain item endpoints enforce owner-or-grant. A caller
with no grant over another user's record gets 403/404; owners and
grant-holders per the mapping get 200.
"""
from __future__ import annotations

import pytest


@pytest.fixture
def actors(factory):
    a = factory.actor("hz-a")
    b = factory.actor("hz-b")
    return {"A": a, "B": b, "SA": factory.super_admin()}


@pytest.fixture
def b_leave(factory, actors):
    return factory.leave_for(actors["B"])


@pytest.fixture
def b_salary(factory, actors):
    return factory.salary_for(actors["B"])


def test_employment_item_owner_and_non_owner(client, actors):
    emp_b = actors["B"]["employment_id"]
    own = client.get(
        f"/api/v1/workforce/employments/{emp_b}", headers=actors["B"]["headers"]
    )
    assert own.status_code == 200, own.text
    other = client.get(
        f"/api/v1/workforce/employments/{emp_b}", headers=actors["A"]["headers"]
    )
    assert other.status_code in (403, 404)


def test_employment_update_owner_and_non_owner(client, actors):
    emp_b = actors["B"]["employment_id"]
    own = client.patch(
        f"/api/v1/workforce/employments/{emp_b}",
        json={"employee_code": actors["B"]["code"]},
        headers=actors["B"]["headers"],
    )
    assert own.status_code == 200, own.text
    other = client.patch(
        f"/api/v1/workforce/employments/{emp_b}",
        json={"employee_code": actors["B"]["code"]},
        headers=actors["A"]["headers"],
    )
    assert other.status_code in (403, 404)


def test_leave_request_item_owner_and_non_owner(client, actors, b_leave):
    own = client.get(
        f"/api/v1/leave/requests/{b_leave['leave_id']}",
        headers=actors["B"]["headers"],
    )
    assert own.status_code == 200, own.text
    other = client.get(
        f"/api/v1/leave/requests/{b_leave['leave_id']}",
        headers=actors["A"]["headers"],
    )
    assert other.status_code in (403, 404)


def test_approval_request_item_owner_and_non_owner(client, actors, b_leave):
    own = client.get(
        f"/api/v1/approvals/requests/{b_leave['approval_id']}",
        headers=actors["B"]["headers"],
    )
    assert own.status_code == 200, own.text
    other = client.get(
        f"/api/v1/approvals/requests/{b_leave['approval_id']}",
        headers=actors["A"]["headers"],
    )
    assert other.status_code in (403, 404)


def test_leave_balances_owner_and_non_owner(client, actors):
    emp_b = actors["B"]["employment_id"]
    own = client.get(
        f"/api/v1/leave/balances/{emp_b}", headers=actors["B"]["headers"]
    )
    assert own.status_code == 200, own.text
    other = client.get(
        f"/api/v1/leave/balances/{emp_b}", headers=actors["A"]["headers"]
    )
    assert other.status_code in (403, 404)


def test_salary_item_owner_and_non_owner(client, actors, b_salary):
    emp_b = actors["B"]["employment_id"]
    own = client.get(
        f"/api/v1/payroll/salaries/{emp_b}", headers=actors["B"]["headers"]
    )
    assert own.status_code == 200, own.text
    # Owner without field grants: record visible, sensitive fields omitted.
    rows = own.json()
    assert rows and "gross_salary" not in rows[0]
    other = client.get(
        f"/api/v1/payroll/salaries/{emp_b}", headers=actors["A"]["headers"]
    )
    assert other.status_code in (403, 404)


def test_super_admin_reads_any_employment(client, actors):
    resp = client.get(
        f"/api/v1/workforce/employments/{actors['B']['employment_id']}",
        headers=actors["SA"]["headers"],
    )
    assert resp.status_code == 200, resp.text


def test_unauthenticated_item_read_rejected(client, actors, b_leave):
    assert (
        client.get(f"/api/v1/leave/requests/{b_leave['leave_id']}").status_code
        == 401
    )
    assert (
        client.get(
            f"/api/v1/workforce/employments/{actors['B']['employment_id']}"
        ).status_code
        == 401
    )
