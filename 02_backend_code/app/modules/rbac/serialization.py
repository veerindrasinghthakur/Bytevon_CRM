"""
Shared response serialization — strip SensitiveField keys the actor cannot read.

Single entry point for all rbac-covered resource responses and any future
export path. There is no separate export-specific filter.

Rules:
- SensitiveField rows for the resource define field keys that may be redacted.
- RoleSensitiveFieldPermission.can_read=True on any of the actor's roles
  allows that key through.
- Super Admin bypasses redaction (sees all fields).
- Non-sensitive keys are never touched.
- Nested dicts/lists of models are walked recursively.
"""
from __future__ import annotations

from typing import Any, Mapping, Optional, Sequence, TypeVar, Union

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.rbac.models import (
    EmployeeRole,
    Resource,
    RoleSensitiveFieldPermission,
    SensitiveField,
)

T = TypeVar("T")

# In-request cache key helpers (callers may pass preloaded sets)


async def load_sensitive_field_keys(
    session: AsyncSession, resource: str
) -> set[str]:
    """All field_key values registered for resources.name = resource."""
    stmt = (
        select(SensitiveField.field_key)
        .join(Resource, Resource.id == SensitiveField.resource_id)
        .where(Resource.name == resource)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return {str(k) for k in rows}


async def load_readable_sensitive_keys(
    session: AsyncSession,
    *,
    employment_id: int,
    resource: str,
) -> set[str]:
    """field_keys the employment may read via RoleSensitiveFieldPermission."""
    stmt = (
        select(SensitiveField.field_key)
        .select_from(EmployeeRole)
        .join(
            RoleSensitiveFieldPermission,
            RoleSensitiveFieldPermission.role_id == EmployeeRole.role_id,
        )
        .join(
            SensitiveField,
            SensitiveField.id == RoleSensitiveFieldPermission.sensitive_field_id,
        )
        .join(Resource, Resource.id == SensitiveField.resource_id)
        .where(
            EmployeeRole.employment_id == employment_id,
            Resource.name == resource,
            RoleSensitiveFieldPermission.can_read.is_(True),
        )
    )
    rows = (await session.execute(stmt)).scalars().all()
    return {str(k) for k in rows}


def redact_mapping(
    data: Mapping[str, Any],
    *,
    sensitive_keys: set[str],
    readable_keys: set[str],
) -> dict[str, Any]:
    """
    Copy mapping; set disallowed sensitive keys to None (keep shape for clients).

    Nested dicts and list[dict] are processed the same way.
    """
    out: dict[str, Any] = {}
    for key, value in data.items():
        if key in sensitive_keys and key not in readable_keys:
            out[key] = None
            continue
        if isinstance(value, dict):
            out[key] = redact_mapping(
                value, sensitive_keys=sensitive_keys, readable_keys=readable_keys
            )
        elif isinstance(value, list):
            out[key] = [
                redact_mapping(item, sensitive_keys=sensitive_keys, readable_keys=readable_keys)
                if isinstance(item, dict)
                else item
                for item in value
            ]
        else:
            out[key] = value
    return out


def filter_sensitive_fields(
    payload: Union[BaseModel, Mapping[str, Any], Sequence[Any]],
    *,
    sensitive_keys: set[str],
    readable_keys: set[str],
) -> Any:
    """
    Pure filter used by filter_response and by export paths.

    Accepts a Pydantic model, dict, or list thereof. Returns the same shape.
    """
    if isinstance(payload, BaseModel):
        data = redact_mapping(
            payload.model_dump(),
            sensitive_keys=sensitive_keys,
            readable_keys=readable_keys,
        )
        return type(payload).model_validate(data)
    if isinstance(payload, Mapping):
        return redact_mapping(
            payload, sensitive_keys=sensitive_keys, readable_keys=readable_keys
        )
    if isinstance(payload, (list, tuple)):
        return [
            filter_sensitive_fields(
                item, sensitive_keys=sensitive_keys, readable_keys=readable_keys
            )
            for item in payload
        ]
    return payload


async def filter_response(
    session: AsyncSession,
    *,
    actor_employment_id: int,
    resource: str,
    payload: T,
    is_super_admin: bool = False,
    sensitive_keys: Optional[set[str]] = None,
    readable_keys: Optional[set[str]] = None,
) -> T:
    """
    The one shared serialization step for rbac-covered resources.

    Use this from every response builder and every export serializer.
    """
    if is_super_admin:
        return payload

    if sensitive_keys is None:
        sensitive_keys = await load_sensitive_field_keys(session, resource)
    if not sensitive_keys:
        return payload

    if readable_keys is None:
        readable_keys = await load_readable_sensitive_keys(
            session, employment_id=actor_employment_id, resource=resource
        )

    return filter_sensitive_fields(
        payload, sensitive_keys=sensitive_keys, readable_keys=readable_keys
    )
