"""Authorization dependency — RBAC permission + scope enforcement (SEC-002).

Contracts:
- Super Admin: JWT required; bypasses scope/resource checks.
- Scope hierarchy: SELF < TEAM < DEPARTMENT < LOCATION < ORGANIZATION.
- Scope-union (replaces CUSTOM): handler uses enforce_owner_or_grant —
  pass if owner-match OR grant rank >= DEPARTMENT (SELF-only never opens
  other users' records). TODO(ScopeResolver): merge when scoping package lands.
"""
from __future__ import annotations

from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from typing import Annotated, Any

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.dependencies import get_current_login, get_token_payload
from app.core.exceptions.exception import NotFoundError
from app.core.security.token_payload import TokenPayload
from app.modules.auth.models import Login

SCOPE_RANK: dict[str, int] = {
    "SELF": 1,
    "TEAM": 2,
    "DEPARTMENT": 3,
    "LOCATION": 4,
    "ORGANIZATION": 5,
}

# Non-owner access on owner-or-grant endpoints requires ≥ DEPARTMENT.
# TODO(ScopeResolver): rename when CUSTOM is fully purged from comments.
OWNER_OR_GRANT_MIN_RANK = SCOPE_RANK["DEPARTMENT"]
# Back-compat alias for imports still using the old name during migration.
CUSTOM_NON_OWNER_MIN_RANK = OWNER_OR_GRANT_MIN_RANK


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
    resource: str, action: str, scope: str = "ORGANIZATION", union: bool = False
) -> Callable[..., Coroutine[Any, Any, AuthContext]]:
    """FastAPI dependency factory enforcing (resource, action, scope).

    For owner-or-grant routes: use scope="SELF", union=True + enforce_owner_or_grant
    in handler (union of owner-match OR ≥ DEPARTMENT grant). With union=True the
    guard enforces authentication only and the handler decides — this restores the
    retired-CUSTOM behavior where grant-less owners could reach their own record.
    Genuine SELF-gated routes (no handler union check) must NOT pass union=True.
    TODO(ScopeResolver): replace inline union with scoped SQL when available.
    """
    scope_name = scope.upper()
    # CUSTOM retired — treat as SELF (rank gate only; handler does union).
    if scope_name == "CUSTOM":
        scope_name = "SELF"
    required_rank = SCOPE_RANK.get(scope_name, SCOPE_RANK["ORGANIZATION"])

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
        if union:
            # Owner-or-grant route: authentication enforced above; the handler
            # must call enforce_owner_or_grant() to decide (owner-match OR
            # ≥ DEPARTMENT grant). Skipping the rank/action gates here preserves
            # grant-less self-access exactly as the retired CUSTOM scope did.
            return ctx

        grant_scope = (ctx.scopes.get(resource) or "").upper()
        if SCOPE_RANK.get(grant_scope, 0) < required_rank:
            raise NotFoundError(
                "You don't have permission to access this resource",
                code="insufficient_permission",
            )
        permissions = effective.permissions or {}
        resource_perms = permissions.get(resource)
        if resource_perms is not None and not resource_perms.get(action.lower(), False):
            raise NotFoundError(
                "You don't have permission to perform this action",
                code="insufficient_permission",
            )
        return ctx

    guard.__name__ = f"require_{resource}_{action.lower()}_{scope_name.lower()}"
    if union:
        guard.__name__ += "_union"
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
    """Scope-union: owner, Super Admin, or grant rank >= DEPARTMENT.

    TODO(ScopeResolver): replace with scoped SQL when available.
    Raises 404 (hide existence) otherwise.
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
    if SCOPE_RANK.get(grant_scope, 0) >= OWNER_OR_GRANT_MIN_RANK:
        return
    raise NotFoundError(
        "You don't have permission to access this resource",
        code="insufficient_permission",
    )
