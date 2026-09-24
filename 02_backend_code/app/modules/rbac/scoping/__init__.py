"""Scope resolution for data-boundary enforcement (list/create filters).

Does not replace get_effective_permissions (FE visibility). This package
translates role_permission grants into concrete ID sets for repository filters.
"""

from app.modules.rbac.scoping.adapters import (
    EmployeeScopeAdapter,
    LeaveScopeAdapter,
    SCOPE_ADAPTERS,
    ScopeAdapter,
    apply_scope,
    get_scope_adapter,
)
from app.modules.rbac.scoping.constraint import ScopeConstraint
from app.modules.rbac.scoping.resolver import ActorContext, ScopeResolver

__all__ = [
    "ActorContext",
    "EmployeeScopeAdapter",
    "LeaveScopeAdapter",
    "SCOPE_ADAPTERS",
    "ScopeAdapter",
    "ScopeConstraint",
    "ScopeResolver",
    "apply_scope",
    "get_scope_adapter",
]
