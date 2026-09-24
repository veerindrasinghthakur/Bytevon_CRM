"""Authorization dependency — RBAC permission + scope enforcement (SEC-002).

Error contract (data-scoped endpoints):
- ForbiddenError (403): actor has NO grant at all for resource+action.
- NotFoundError (404): actor has the grant, but the scoped query returns
  zero rows (missing or out of scope — identical response).

ScopeResolver + adapters enforce data boundaries on list/detail queries.
require_permission(..., "ANY") only checks that some grant exists for the
action; list handlers then apply ScopeConstraint filters.
"""
from __future__ import annotations

from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from typing import Annotated, Any

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.dependencies import get_current_login, get_token_payload
from app.core.exceptions.exception import ForbiddenError, NotFoundError
from app.core.security.token_payload import TokenPayload
from app.modules.auth.models import Login

SCOPE_RANK: dict[str, int] = {
    "SELF": 1,
    "TEAM": 2,
    "DEPARTMENT": 3,
    "LOCATION": 4,
    "ORGANIZATION": 5,
}

CUSTOM_NON_OWNER_MIN_RANK = SCOPE_RANK["DEPARTMENT"]


@dataclass
class AuthContext:
    employment_id: int
    login_id: int
    person_id: int
    is_super_admin: bool = False
    scopes: dict[str, str] = field(default_factory=dict)


def _resolve_employment_id(
    payload: TokenPayload, x_employment_id: int | None, person_employment_ids: set[int]
) -> int:
    if payload.employment_id is not None and x_employment_id in (
        None,
        payload.employment_id,
    ):
        return payload.employment_id
    if x_employment_id is None:
        raise NotFoundError("Resource not found")
    if x_employment_id not in person_employment_ids:
        raise NotFoundError("Resource not found")
    return x_employment_id


SUPER_ADMIN_ROLE_NAMES = ("Super Admin", "SuperAdmin")

ACCOUNT_SELF_PATHS = frozenset(
    {
        ("POST", "/api/v1/auth/logout"),
        ("POST", "/api/v1/auth/change-password"),
        ("GET", "/api/v1/auth/sessions"),
        ("GET", "/api/v1/profile/sessions"),
    }
)


async def _has_super_admin_role(session: AsyncSession, employment_id: int) -> bool:
    from sqlalchemy import select

    from app.modules.rbac.models import EmployeeRole, Role

    row = (
        await session.execute(
            select(Role.name)
            .join(EmployeeRole, EmployeeRole.role_id == Role.id)
            .where(EmployeeRole.employment_id == employment_id)
        )
    ).scalars().all()
    return any(name in SUPER_ADMIN_ROLE_NAMES for name in row)


def require_permission(
    resource: str, action: str, scope: str = "ORGANIZATION"
) -> Callable[..., Coroutine[Any, Any, AuthContext]]:
    """FastAPI dependency factory enforcing (resource, action, scope).

    scope="ANY": only requires that the actor has *some* grant for the action
    (used by list endpoints that apply ScopeResolver data filters).
    scope="CUSTOM": auth only; handler uses enforce_owner_or_grant or scoped fetch.
    """
    required_rank = SCOPE_RANK.get(scope.upper(), 0 if scope.upper() == "ANY" else SCOPE_RANK["ORGANIZATION"])
    scope_name = scope.upper()

    async def guard(
        payload: Annotated[TokenPayload, Depends(get_token_payload)],
        login: Annotated[Login, Depends(get_current_login)],
        session: Annotated[AsyncSession, Depends(get_db_session)],
        x_employment_id: Annotated[int | None, Header(alias="X-Employment-Id")] = None,
    ) -> AuthContext:
        from sqlalchemy import select

        from app.modules.rbac.service import RBACService
        from app.modules.workforce.models import Employment

        person_employment_ids = set(
            (
                await session.execute(
                    select(Employment.id).where(Employment.person_id == payload.person_id)
                )
            ).scalars().all()
        )
        employment_id = _resolve_employment_id(payload, x_employment_id, person_employment_ids)

        rbac = RBACService(session)
        effective = await rbac.get_effective_permissions(employment_id)
        ctx = AuthContext(
            employment_id=employment_id,
            login_id=login.id,
            person_id=payload.person_id,
            is_super_admin=bool(effective.is_super_admin)
            or await _has_super_admin_role(session, employment_id),
            scopes=dict(effective.scope_by_resource or {}),
        )
        if ctx.is_super_admin:
            return ctx
        if scope_name == "CUSTOM":
            return ctx

        permissions = effective.permissions or {}
        resource_perms = permissions.get(resource)
        has_action = bool(resource_perms and resource_perms.get(action.lower(), False))
        if not has_action:
            # No grant at all for this resource+action → 403
            raise ForbiddenError(
                "You don't have permission to perform this action",
                code="insufficient_permission",
            )

        if scope_name == "ANY":
            # Grant exists; ScopeResolver applies data boundary in the handler.
            return ctx

        grant_scope = (ctx.scopes.get(resource) or "").upper()
        if SCOPE_RANK.get(grant_scope, 0) < required_rank:
            # Has some grant but not wide enough for this endpoint's rank gate.
            raise ForbiddenError(
                "You don't have permission to access this resource",
                code="insufficient_permission",
            )
        return ctx

    guard.__name__ = f"require_{resource}_{action.lower()}_{scope_name.lower()}"
    return guard


def enforce_owner_or_grant(
    ctx: AuthContext,
    resource: str,
    action: str,
    *,
    owner_employment_id: int | None = None,
    owner_person_id: int | None = None,
    owner_login_id: int | None = None,
) -> None:
    """CUSTOM-scope handler rule: owner, Super Admin, or >= DEPARTMENT grant.

    Prefer scoped SQL fetch (id + ScopeConstraint) for detail endpoints;
    this helper remains for paths not yet on ScopeResolver.
    Out-of-scope → 404 (hide existence).
    """
    if ctx.is_super_admin:
        return
    if owner_employment_id is not None and owner_employment_id == ctx.employment_id:
        return
    if owner_person_id is not None and owner_person_id == ctx.person_id:
        return
    if owner_login_id is not None and owner_login_id == ctx.login_id:
        return
    grant_scope = (ctx.scopes.get(resource) or "").upper()
    if SCOPE_RANK.get(grant_scope, 0) >= CUSTOM_NON_OWNER_MIN_RANK:
        return
    raise NotFoundError(
        "Resource not found",
        code="not_found",
    )
