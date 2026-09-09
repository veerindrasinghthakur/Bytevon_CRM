"""Admin user management — compose queries + mutations mixins."""
from __future__ import annotations

from app.modules.organization.services.admin_users_mutations import AdminUsersMutationsMixin
from app.modules.organization.services.admin_users_queries import AdminUsersMixin as _Queries


class AdminUsersMixin(_Queries, AdminUsersMutationsMixin):
    """Login account admin ops used by OrganizationPublicService."""
    pass
