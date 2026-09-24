"""Validate create payloads against ScopeResolver.scope_for_create() output."""

from __future__ import annotations

from typing import Any, Mapping, Optional

from app.core.exceptions.exception import ForbiddenError
from app.modules.rbac.authz_decision import log_authz_decision


def validate_create_payload(
    allowed: Mapping[str, Any],
    *,
    department_id: Optional[int] = None,
    location_id: Optional[int] = None,
    team_id: Optional[int] = None,
    employment_id: Optional[int] = None,
    actor_employment_id: Optional[int] = None,
    resource: str = "unknown",
) -> None:
    """
    Raise ForbiddenError if payload FK values fall outside the CREATE scope.

    Never silently overwrites the payload. organization_wide / unrestricted
    skips all checks.
    """
    if allowed.get("organization_wide") or allowed.get("unrestricted"):
        return

    def _check(value: Optional[int], key: str, label: str) -> None:
        if value is None:
            return
        allowed_ids = list(allowed.get(key) or [])
        if not allowed_ids or value not in allowed_ids:
            log_authz_decision(
                actor_employment_id=actor_employment_id,
                resource=resource,
                action="CREATE",
                result="DENY",
                reason=f"create_scope_violation {label}={value}",
                resolved_scope=allowed,
            )
            raise ForbiddenError(
                f"{label} {value} is outside your create scope for this resource",
                code="create_scope_violation",
            )

    _check(department_id, "department_ids", "department_id")
    _check(location_id, "location_ids", "location_id")
    _check(team_id, "team_ids", "team_id")
    _check(employment_id, "employment_ids", "employment_id")
