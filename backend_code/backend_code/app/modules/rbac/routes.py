"""
RBAC HTTP routes.
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.rbac.dependencies import RBACServiceDep
from app.modules.rbac.schemas.schemas import (
    AssignRoleRequest,
    EffectivePermissionsResponse,
    EmployeeRoleResponse,
    MessageResponse,
    PermissionResponse,
    ResourceResponse,
    RoleCreate,
    RoleDetailResponse,
    RolePermissionGrant,
    RolePermissionResponse,
    RoleResponse,
    RoleSensitiveFieldPermissionResponse,
    RoleSensitiveFieldPermissionSet,
    RoleUpdate,
    ScopeResponse,
    SensitiveFieldResponse,
)

router = APIRouter(prefix="/rbac", tags=["RBAC"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


# ---------------------------------------------------------------------------
# Seeded catalogues
# ---------------------------------------------------------------------------

@router.get("/resources", response_model=list[ResourceResponse])
async def list_resources(service: RBACServiceDep) -> list[ResourceResponse]:
    return await service.list_resources()


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    service: RBACServiceDep,
    resource_id: Optional[int] = Query(None),
) -> list[PermissionResponse]:
    return await service.list_permissions(resource_id=resource_id)


@router.get("/scopes", response_model=list[ScopeResponse])
async def list_scopes(service: RBACServiceDep) -> list[ScopeResponse]:
    return await service.list_scopes()


@router.get("/sensitive-fields", response_model=list[SensitiveFieldResponse])
async def list_sensitive_fields(
    service: RBACServiceDep,
    resource_id: Optional[int] = Query(None),
) -> list[SensitiveFieldResponse]:
    return await service.list_sensitive_fields(resource_id=resource_id)


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------

@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_role(
    body: RoleCreate,
    service: RBACServiceDep,
    actor: ActorHeader = None,
) -> RoleResponse:
    return await service.create_role(body, actor_employment_id=actor)


@router.get("/roles", response_model=list[RoleResponse])
async def list_roles(service: RBACServiceDep) -> list[RoleResponse]:
    return await service.list_roles()


@router.get("/roles/{role_id}", response_model=RoleDetailResponse)
async def get_role(role_id: int, service: RBACServiceDep) -> RoleDetailResponse:
    return await service.get_role(role_id)


@router.patch("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    body: RoleUpdate,
    service: RBACServiceDep,
    actor: ActorHeader = None,
) -> RoleResponse:
    return await service.update_role(role_id, body, actor_employment_id=actor)


@router.delete("/roles/{role_id}", response_model=MessageResponse)
async def delete_role(
    role_id: int,
    service: RBACServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.delete_role(role_id, actor_employment_id=actor)


# ---------------------------------------------------------------------------
# Role permissions
# ---------------------------------------------------------------------------

@router.post(
    "/roles/{role_id}/permissions",
    response_model=RolePermissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def grant_permission(
    role_id: int,
    body: RolePermissionGrant,
    service: RBACServiceDep,
    actor: ActorHeader = None,
) -> RolePermissionResponse:
    return await service.grant_permission(role_id, body, actor_employment_id=actor)


@router.delete(
    "/roles/{role_id}/permissions/{permission_id}/scopes/{scope_id}",
    response_model=MessageResponse,
)
async def revoke_permission(
    role_id: int,
    permission_id: int,
    scope_id: int,
    service: RBACServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.revoke_permission(
        role_id, permission_id, scope_id, actor_employment_id=actor
    )


# ---------------------------------------------------------------------------
# Employee roles
# ---------------------------------------------------------------------------

@router.post(
    "/employments/{employment_id}/roles",
    response_model=EmployeeRoleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def assign_role(
    employment_id: int,
    body: AssignRoleRequest,
    service: RBACServiceDep,
    actor: ActorHeader = None,
) -> EmployeeRoleResponse:
    return await service.assign_role(
        employment_id, body, actor_employment_id=actor
    )


@router.delete(
    "/employments/{employment_id}/roles/{role_id}",
    response_model=MessageResponse,
)
async def unassign_role(
    employment_id: int,
    role_id: int,
    service: RBACServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.unassign_role(
        employment_id, role_id, actor_employment_id=actor
    )


@router.get(
    "/employments/{employment_id}/roles",
    response_model=list[EmployeeRoleResponse],
)
async def list_roles_for_employment(
    employment_id: int,
    service: RBACServiceDep,
) -> list[EmployeeRoleResponse]:
    return await service.list_roles_for_employment(employment_id)


@router.get(
    "/employments/{employment_id}/effective-permissions",
    response_model=EffectivePermissionsResponse,
)
async def get_effective_permissions(
    employment_id: int,
    service: RBACServiceDep,
) -> EffectivePermissionsResponse:
    return await service.get_effective_permissions(employment_id)


# ---------------------------------------------------------------------------
# Sensitive field permissions
# ---------------------------------------------------------------------------

@router.put(
    "/roles/{role_id}/sensitive-fields",
    response_model=RoleSensitiveFieldPermissionResponse,
)
async def set_sensitive_field_permission(
    role_id: int,
    body: RoleSensitiveFieldPermissionSet,
    service: RBACServiceDep,
    actor: ActorHeader = None,
) -> RoleSensitiveFieldPermissionResponse:
    return await service.set_sensitive_field_permission(
        role_id, body, actor_employment_id=actor
    )
