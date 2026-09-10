"""
RBACPublicService — only public entry point for RBAC.

Owns the transaction.
- resources / permissions / scopes / sensitive_fields are seeded (read-only via API).
- roles, role_permissions, employee_roles, role_sensitive_field_permissions are admin-managed.
- Additive only (architecture rule).
- Always keep ≥ 1 super-admin is enforced at Employment/RBAC boundary when system role is known.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import Action
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.rbac.models import (
    EmployeeRole,
    Role,
    RolePermission,
    RoleSensitiveFieldPermission,
)
from app.modules.rbac.repositories.repository import RBACRepository
from app.modules.rbac.schemas.schemas import (
    AssignRoleRequest,
    EffectivePermissionItem,
    EffectivePermissionsResponse,
    EmployeeRoleResponse,
    MessageResponse,
    PermissionResponse,
    ResourceResponse,
    RoleCreate,
    RoleDetailResponse,
    RolePermissionDetail,
    RolePermissionGrant,
    RolePermissionResponse,
    RoleResponse,
    RoleSensitiveFieldPermissionResponse,
    RoleSensitiveFieldPermissionSet,
    RoleUpdate,
    ScopeResponse,
    SensitiveFieldResponse,
)

logger = logging.getLogger(__name__)

# Convention: system role named "Super Admin" (or similar) must never lose its last holder.
SUPER_ADMIN_ROLE_NAME = "Super Admin"
DEFAULT_SCOPE_NAME = "ORGANIZATION"


class RBACPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = RBACRepository(session)

    # ==================================================================
    # Seeded read surfaces
    # ==================================================================

    async def list_resources(self) -> list[ResourceResponse]:
        rows = await self._repo.list_resources()
        return [ResourceResponse.model_validate(r) for r in rows]

    async def list_permissions(
        self, *, resource_id: Optional[int] = None
    ) -> list[PermissionResponse]:
        rows = await self._repo.list_permissions(resource_id=resource_id)
        return [PermissionResponse.model_validate(r) for r in rows]

    async def list_scopes(self) -> list[ScopeResponse]:
        rows = await self._repo.list_scopes()
        return [ScopeResponse.model_validate(r) for r in rows]

    async def list_sensitive_fields(
        self, *, resource_id: Optional[int] = None
    ) -> list[SensitiveFieldResponse]:
        rows = await self._repo.list_sensitive_fields(resource_id=resource_id)
        return [SensitiveFieldResponse.model_validate(r) for r in rows]

    # ==================================================================
    # Roles
    # ==================================================================

    async def _resolve_default_scope_id(self, scope_id: Optional[int]) -> int:
        if scope_id is not None:
            scope = await self._repo.get_scope_by_id(scope_id)
            if scope is None:
                raise NotFoundError("Scope not found")
            return scope.id
        scope = await self._repo.get_scope_by_name(DEFAULT_SCOPE_NAME)
        if scope is None:
            # Fall back to first available scope
            scopes = await self._repo.list_scopes()
            if not scopes:
                raise DomainError("No scopes seeded; cannot grant permissions")
            return scopes[0].id
        return scope.id

    async def _grant_permission_ids(
        self,
        role_id: int,
        permission_ids: List[int],
        *,
        scope_id: int,
        actor_employment_id: Optional[int],
        replace: bool = False,
    ) -> None:
        """Grant a set of permission ids under one scope. Optionally clear existing first."""
        if replace:
            await self._repo.delete_all_role_permissions(role_id)

        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        seen: set[int] = set()
        for pid in permission_ids:
            if pid in seen:
                continue
            seen.add(pid)
            perm = await self._repo.get_permission_by_id(pid)
            if perm is None:
                raise NotFoundError(f"Permission id {pid} not found")
            existing = await self._repo.get_role_permission(role_id, pid, scope_id)
            if existing:
                continue
            rp = RolePermission(
                role_id=role_id,
                permission_id=pid,
                scope_id=scope_id,
                changed_by=actor,
            )
            await self._repo.add(rp)

    def _build_role_detail(self, role: Role) -> RoleDetailResponse:
        details: list[RolePermissionDetail] = []
        keys: list[str] = []
        for rp in role.role_permissions or []:
            perm = getattr(rp, "permission", None)
            resource = getattr(perm, "resource", None) if perm is not None else None
            scope = getattr(rp, "scope", None)
            action_val = None
            if perm is not None:
                action_val = (
                    perm.action.value if hasattr(perm.action, "value") else str(perm.action)
                )
            resource_name = resource.name if resource is not None else None
            scope_name = scope.name if scope is not None else None
            key = None
            if resource_name and action_val:
                key = f"{resource_name.lower()}.{action_val.lower()}"
                keys.append(key)
            details.append(
                RolePermissionDetail(
                    id=rp.id,
                    permission_id=rp.permission_id,
                    scope_id=rp.scope_id,
                    resource_name=resource_name,
                    action=action_val,
                    scope_name=scope_name,
                    key=key,
                )
            )
        return RoleDetailResponse(
            **RoleResponse.model_validate(role).model_dump(),
            permissions=[
                RolePermissionResponse.model_validate(rp)
                for rp in role.role_permissions or []
            ],
            permission_details=details,
            permission_keys=keys,
            sensitive_field_permissions=[
                RoleSensitiveFieldPermissionResponse.model_validate(sfp)
                for sfp in role.sensitive_field_permissions or []
            ],
        )

    async def create_role(
        self,
        data: RoleCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> RoleResponse:
        existing = await self._repo.get_role_by_name(data.name)
        if existing:
            raise ConflictError(f"Role '{data.name}' already exists")

        role = Role(
            name=data.name,
            description=data.description,
            is_system_role=data.is_system_role,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(role)
        await self._session.flush()  # get role.id before grants

        if data.permission_ids:
            scope_id = await self._resolve_default_scope_id(data.scope_id)
            await self._grant_permission_ids(
                role.id,
                data.permission_ids,
                scope_id=scope_id,
                actor_employment_id=actor_employment_id,
                replace=False,
            )

        await self._commit()
        await self._audit("role.created", role.id, actor_employment_id)
        return RoleResponse.model_validate(role)

    async def get_role(self, role_id: int) -> RoleDetailResponse:
        role = await self._repo.get_role_by_id(role_id, with_details=True)
        if role is None:
            raise NotFoundError("Role not found")
        return self._build_role_detail(role)

    async def list_roles(self) -> list[RoleResponse]:
        rows = await self._repo.list_roles()
        return [RoleResponse.model_validate(r) for r in rows]

    async def update_role(
        self,
        role_id: int,
        data: RoleUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> RoleResponse:
        role = await self._repo.get_role_by_id(role_id)
        if role is None:
            raise NotFoundError("Role not found")
        if role.is_system_role and data.name is not None and data.name != role.name:
            raise DomainError("Cannot rename a system role")

        if data.name is not None and data.name != role.name:
            clash = await self._repo.get_role_by_name(data.name)
            if clash:
                raise ConflictError(f"Role '{data.name}' already exists")
            role.name = data.name
        if data.description is not None:
            role.description = data.description
        role.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID

        if data.permission_ids is not None:
            scope_id = await self._resolve_default_scope_id(data.scope_id)
            await self._grant_permission_ids(
                role.id,
                data.permission_ids,
                scope_id=scope_id,
                actor_employment_id=actor_employment_id,
                replace=True,
            )

        await self._commit()
        await self._audit("role.updated", role.id, actor_employment_id)
        return RoleResponse.model_validate(role)

    async def delete_role(
        self,
        role_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MessageResponse:
        """
        Soft conceptual delete: only allowed if not system role and no assignments.
        Schema has no is_archived on roles; we refuse hard delete of system roles
        and roles still assigned.
        """
        role = await self._repo.get_role_by_id(role_id)
        if role is None:
            raise NotFoundError("Role not found")
        if role.is_system_role:
            raise DomainError("Cannot delete a system role")

        assigned = await self._repo.count_employments_with_role(role_id)
        if assigned > 0:
            raise DomainError(
                f"Role is still assigned to {assigned} employment(s); unassign first"
            )

        # Hard delete of unassigned non-system role (admin cleanup)
        await self._session.delete(role)
        await self._commit()
        await self._audit("role.deleted", role_id, actor_employment_id)
        return MessageResponse(message="Role deleted")

    # ==================================================================
    # Grant / revoke permission on role
    # ==================================================================

    async def grant_permission(
        self,
        role_id: int,
        data: RolePermissionGrant,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> RolePermissionResponse:
        role = await self._repo.get_role_by_id(role_id)
        if role is None:
            raise NotFoundError("Role not found")

        perm = await self._repo.get_permission_by_id(data.permission_id)
        if perm is None:
            raise NotFoundError("Permission not found")
        scope = await self._repo.get_scope_by_id(data.scope_id)
        if scope is None:
            raise NotFoundError("Scope not found")

        existing = await self._repo.get_role_permission(
            role_id, data.permission_id, data.scope_id
        )
        if existing:
            raise ConflictError("Permission already granted for this scope")

        rp = RolePermission(
            role_id=role_id,
            permission_id=data.permission_id,
            scope_id=data.scope_id,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(rp)
        await self._commit()
        await self._audit("role.permission_granted", rp.id, actor_employment_id)
        return RolePermissionResponse.model_validate(rp)

    async def revoke_permission(
        self,
        role_id: int,
        permission_id: int,
        scope_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MessageResponse:
        role = await self._repo.get_role_by_id(role_id)
        if role is None:
            raise NotFoundError("Role not found")

        existing = await self._repo.get_role_permission(
            role_id, permission_id, scope_id
        )
        if existing is None:
            raise NotFoundError("Role permission not found")

        await self._repo.delete_role_permission(role_id, permission_id, scope_id)
        await self._commit()
        await self._audit("role.permission_revoked", role_id, actor_employment_id)
        return MessageResponse(message="Permission revoked")

    # ==================================================================
    # Assign / unassign role to employment
    # ==================================================================

    async def assign_role(
        self,
        employment_id: int,
        data: AssignRoleRequest,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> EmployeeRoleResponse:
        role = await self._repo.get_role_by_id(data.role_id)
        if role is None:
            raise NotFoundError("Role not found")

        existing = await self._repo.get_employee_role(employment_id, data.role_id)
        if existing:
            raise ConflictError("Role already assigned to this employment")

        er = EmployeeRole(
            employment_id=employment_id,
            role_id=data.role_id,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(er)
        await self._commit()
        await self._audit("employee_role.assigned", er.id, actor_employment_id)
        return EmployeeRoleResponse.model_validate(er)

    async def unassign_role(
        self,
        employment_id: int,
        role_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MessageResponse:
        role = await self._repo.get_role_by_id(role_id)
        if role is None:
            raise NotFoundError("Role not found")

        existing = await self._repo.get_employee_role(employment_id, role_id)
        if existing is None:
            raise NotFoundError("Role assignment not found")

        # Protect last Super Admin
        if role.name == SUPER_ADMIN_ROLE_NAME or role.is_system_role:
            count = await self._repo.count_employments_with_role(role_id)
            if count <= 1:
                raise DomainError(
                    "Cannot remove the last holder of a system / Super Admin role"
                )

        await self._repo.delete_employee_role(employment_id, role_id)
        await self._commit()
        await self._audit("employee_role.unassigned", employment_id, actor_employment_id)
        return MessageResponse(message="Role unassigned")

    async def list_roles_for_employment(
        self, employment_id: int
    ) -> list[EmployeeRoleResponse]:
        rows = await self._repo.list_roles_for_employment(employment_id)
        return [EmployeeRoleResponse.model_validate(r) for r in rows]

    # ==================================================================
    # Sensitive field permissions
    # ==================================================================

    async def set_sensitive_field_permission(
        self,
        role_id: int,
        data: RoleSensitiveFieldPermissionSet,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> RoleSensitiveFieldPermissionResponse:
        role = await self._repo.get_role_by_id(role_id)
        if role is None:
            raise NotFoundError("Role not found")
        field = await self._repo.get_sensitive_field_by_id(data.sensitive_field_id)
        if field is None:
            raise NotFoundError("Sensitive field not found")

        existing = await self._repo.get_role_sensitive_field_permission(
            role_id, data.sensitive_field_id
        )
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID

        if existing:
            existing.can_read = data.can_read
            existing.can_update = data.can_update
            existing.changed_by = actor
            row = existing
        else:
            row = RoleSensitiveFieldPermission(
                role_id=role_id,
                sensitive_field_id=data.sensitive_field_id,
                can_read=data.can_read,
                can_update=data.can_update,
                changed_by=actor,
            )
            await self._repo.add(row)

        await self._commit()
        await self._audit(
            "role.sensitive_field_permission_set", row.id, actor_employment_id
        )
        return RoleSensitiveFieldPermissionResponse.model_validate(row)

    # ==================================================================
    # Effective permissions helper (for authorization checks)
    # ==================================================================

    async def get_effective_permissions(
        self, employment_id: int
    ) -> EffectivePermissionsResponse:
        """
        Build FE-aligned effective authorization:
        nested permissions tree, overall scope, scope_by_resource,
        is_super_admin, plus flat grants for tooling.
        """
        SCOPE_RANK = {
            "SELF": 1,
            "TEAM": 2,
            "DEPARTMENT": 3,
            "LOCATION": 4,
            "ORGANIZATION": 5,
            "CUSTOM": 0,
        }
        ACTION_KEYS = (
            "view",
            "create",
            "update",
            "delete",
            "approve",
            "export",
            "unlock",
        )

        def max_scope(a: str, b: str) -> str:
            return a if SCOPE_RANK.get(a, 0) >= SCOPE_RANK.get(b, 0) else b

        rows = await self._repo.load_effective_permissions_for_employment(employment_id)
        role_names: set[str] = set()
        items: list[EffectivePermissionItem] = []
        seen: set[tuple] = set()
        nested: dict[str, dict[str, bool]] = {}
        scope_by_resource: dict[str, str] = {}
        overall = "SELF"

        for resource_name, action, scope_name, role_name in rows:
            role_names.add(str(role_name))
            action_val = action.value if hasattr(action, "value") else str(action)
            scope_val = scope_name.value if hasattr(scope_name, "value") else str(scope_name)
            key = (str(resource_name), action_val, scope_val)
            if key not in seen:
                seen.add(key)
                try:
                    action_enum = action if hasattr(action, "value") else Action(str(action))
                except Exception:
                    action_enum = action
                items.append(
                    EffectivePermissionItem(
                        resource_name=str(resource_name),
                        action=action_enum,
                        scope_name=scope_val,
                    )
                )
            # nested tree — lowercase action keys for FE
            rname = str(resource_name)
            akey = action_val.lower()
            if rname not in nested:
                nested[rname] = {k: False for k in ACTION_KEYS}
            if akey in nested[rname]:
                nested[rname][akey] = True
            prev = scope_by_resource.get(rname)
            scope_by_resource[rname] = (
                max_scope(prev, scope_val) if prev else scope_val
            )
            overall = max_scope(overall, scope_val)

        is_super = any(n.lower() in ("super admin", "superadmin") for n in role_names)

        if is_super:
            # Full access: all seeded resources × all actions @ ORGANIZATION
            resources = await self._repo.list_resources()
            nested = {}
            scope_by_resource = {}
            for res in resources:
                rname = str(res.name)
                nested[rname] = {k: True for k in ACTION_KEYS}
                scope_by_resource[rname] = "ORGANIZATION"
            overall = "ORGANIZATION"

        return EffectivePermissionsResponse(
            employment_id=employment_id,
            is_super_admin=is_super,
            roles=sorted(role_names),
            permissions=nested,
            scope=overall,
            scope_by_resource=scope_by_resource,
            grants=items,
        )
