"""Scope resolution for data-boundary enforcement (list/create filters).

Does not replace get_effective_permissions (FE visibility). This package
translates role_permission grants into concrete ID sets for repository filters.
"""

from app.modules.rbac.scoping.constraint import ScopeConstraint
from app.modules.rbac.scoping.resolver import ActorContext, ScopeResolver

__all__ = [
    "ActorContext",
    "ScopeConstraint",
    "ScopeResolver",
]
