"""Sensitive-field filtering at the serialization/response boundary (SEC-008).

Sensitive Field Contract:
- can_read=true  -> field INCLUDED in detail + list responses.
- can_read=false -> field OMITTED (absent, not null) in detail + list + export.
- can_update=true  -> create/update accepted if business rules allow.
- can_update=false -> create/update REJECTED (400) if the field is provided.
- Nested objects follow the parent field's permission.
- Super Admin -> implicit can_read=true, can_update=true on all fields.
- Filtering occurs here (serialization boundary), not in DB queries.

Absent-row policy (documented interpretation — the contract is silent):
- READS default-deny: a sensitive field with no grant row for any of the
  caller's roles is omitted (confidentiality-first).
- WRITES default-allow: absence of a row does not block writes; only an
  explicit can_update=false row rejects (availability; writes remain
  governed by resource/action grants).
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext
from app.core.exceptions.exception import ValidationError
from app.modules.rbac.models import (
    EmployeeRole,
    RoleSensitiveFieldPermission,
    SensitiveField,
)

# resource -> {sensitive field -> nested keys that follow the parent permission}
SENSITIVE_READ_FIELDS: dict[str, dict[str, list[str]]] = {
    "salary": {
        "gross_salary": ["items"],
        "account_number": [],
        "ifsc_code": [],
    },
}


async def _field_permissions(
    session: AsyncSession, resource: str, employment_id: int
) -> dict[str, dict[str, bool]]:
    """{field_key: {"can_read": bool, "can_update": bool}} merged over caller roles.

    Multiple roles: allow wins (can_read/can_update OR-ed).
    """
    from app.modules.rbac.models import Resource

    rows = (
        await session.execute(
            select(
                SensitiveField.field_key,
                RoleSensitiveFieldPermission.can_read,
                RoleSensitiveFieldPermission.can_update,
            )
            .join(Resource, Resource.id == SensitiveField.resource_id)
            .join(
                RoleSensitiveFieldPermission,
                RoleSensitiveFieldPermission.sensitive_field_id == SensitiveField.id,
            )
            .join(
                EmployeeRole,
                EmployeeRole.role_id == RoleSensitiveFieldPermission.role_id,
            )
            .where(
                Resource.name == resource,
                EmployeeRole.employment_id == employment_id,
            )
        )
    ).all()
    out: dict[str, dict[str, bool]] = {}
    for field_key, can_read, can_update in rows:
        prev = out.get(field_key, {"can_read": False, "can_update": False})
        out[field_key] = {
            "can_read": bool(prev["can_read"] or can_read),
            "can_update": bool(prev["can_update"] or can_update),
        }
    return out


def _omit_fields(payload: Any, resource: str, perms: dict[str, dict[str, bool]]) -> Any:
    fields = SENSITIVE_READ_FIELDS.get(resource, {})
    if isinstance(payload, list):
        return [_omit_fields(item, resource, perms) for item in payload]
    if not isinstance(payload, dict):
        return payload
    result = dict(payload)
    for field_key, nested in fields.items():
        allowed = perms.get(field_key, {}).get("can_read", False)
        if not allowed:
            result.pop(field_key, None)
            for child in nested:
                result.pop(child, None)
    return result


async def filter_sensitive_fields(
    payload: Any, *, resource: str, auth: AuthContext, session: AsyncSession
) -> Any:
    """Return payload with denied sensitive fields omitted (reads)."""
    if auth.is_super_admin:
        return payload
    if resource not in SENSITIVE_READ_FIELDS:
        return payload
    perms = await _field_permissions(session, resource, auth.employment_id)
    return _omit_fields(payload, resource, perms)


async def enforce_sensitive_write(
    body: dict[str, Any], *, resource: str, auth: AuthContext, session: AsyncSession
) -> None:
    """Reject (400) writes that provide an explicitly non-updatable field."""
    if auth.is_super_admin:
        return
    fields = SENSITIVE_READ_FIELDS.get(resource, {})
    if not fields:
        return
    perms = await _field_permissions(session, resource, auth.employment_id)
    for field_key in fields:
        row = perms.get(field_key)
        if row is not None and not row.get("can_update", False) and field_key in body:
            raise ValidationError(
                f"Field '{field_key}' is not updatable for your role",
                code="sensitive_field_forbidden",
                status_code=400,
            )
