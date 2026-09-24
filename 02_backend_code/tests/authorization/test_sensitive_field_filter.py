"""Unit tests for shared sensitive-field serialization (no DB)."""
from __future__ import annotations

from pydantic import BaseModel

from app.modules.rbac.serialization import filter_sensitive_fields, redact_mapping


class _Emp(BaseModel):
    id: int
    employee_code: str
    personal_email: str | None = None
    personal_phone: str | None = None
    address: str | None = None


def test_redact_disallowed_keys_to_none():
    data = {
        "id": 1,
        "employee_code": "E1",
        "personal_email": "a@b.com",
        "personal_phone": "999",
        "address": "x",
    }
    out = redact_mapping(
        data,
        sensitive_keys={"personal_email", "personal_phone", "address"},
        readable_keys={"personal_email"},
    )
    assert out["personal_email"] == "a@b.com"
    assert out["personal_phone"] is None
    assert out["address"] is None
    assert out["employee_code"] == "E1"


def test_filter_pydantic_model():
    m = _Emp(
        id=1,
        employee_code="E1",
        personal_email="a@b.com",
        personal_phone="999",
        address="x",
    )
    out = filter_sensitive_fields(
        m,
        sensitive_keys={"personal_email", "personal_phone", "address"},
        readable_keys=set(),
    )
    assert isinstance(out, _Emp)
    assert out.personal_email is None
    assert out.personal_phone is None
    assert out.address is None
    assert out.employee_code == "E1"


def test_filter_list_and_nested():
    payload = [
        {
            "id": 1,
            "person": {"personal_email": "a@b.com", "name": "A"},
        }
    ]
    out = filter_sensitive_fields(
        payload,
        sensitive_keys={"personal_email"},
        readable_keys=set(),
    )
    assert out[0]["person"]["personal_email"] is None
    assert out[0]["person"]["name"] == "A"


def test_no_sensitive_keys_passthrough():
    data = {"id": 1, "x": 2}
    assert (
        redact_mapping(data, sensitive_keys=set(), readable_keys=set()) == data
    )
