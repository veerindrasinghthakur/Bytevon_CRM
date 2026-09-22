"""RBAC HTTP routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.modules.rbac.dependencies import RBACServiceDep
from app.modules.rbac.schemas import (
    AssignRoleRequest,
    EffectivePermissionsResponse,
    EmployeeRoleResponse,
    MessageResponse,
    PermissionResponse,
    ResourceResponse,
    RoleCreate,
    RoleDetailResponse,
    RoleListResponse,
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


@router.get("/resources", response_model=list[ResourceResponse], dependencies=[Depends(require_permission("role", "VIEW", "ORGANIZATION"))])
async def list_resources(service: RBACServiceDep) -> list[ResourceResponse]:
    return await service.list_resources()


@router.get("/permissions", response_model=list[PermissionResponse], dependencies=[Depends(require_permission("role", "VIEW", "ORGANIZATION"))])
async def list_permissions(
    service: RBACServiceDep,
    resource_id: int | None = Query(None),
) -> list[PermissionResponse]:
    return await service.list_permissions(resource_id=resource_id)


@router.get("/scopes", response_model=list[ScopeResponse], dependencies=[Depends(require_permission("role", "VIEW", "ORGANIZATION"))])
async def list_scopes(service: RBACServiceDep) -> list[ScopeResponse]:
    return await service.list_scopes()


@router.get("/sensitive-fields", response_model=list[SensitiveFieldResponse], dependencies=[Depends(require_permission("role", "VIEW", "ORGANIZATION"))])
async def list_sensitive_fields(
    service: RBACServiceDep,
    resource_id: int | None = Query(None),
) -> list[SensitiveFieldResponse]:
    return await service.list_sensitive_fields(resource_id=resource_id)


@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_role(
    body: RoleCreate,
    service: RBACServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("role", "CREATE", "ORGANIZATION"))],
) -> RoleResponse:
    return await service.create_role(body, actor_employment_id=auth.employment_id)


@router.get("/roles", response_model=RoleListResponse, dependencies=[Depends(require_permission("role", "VIEW", "ORGANIZATION"))])
async def list_roles(
    service: RBACServiceDep,
    search: str | None = Query(None),
    category: str | None = Query(None, description="Core Role | Standard"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
) -> RoleListResponse:
    return await service.list_roles(
        search=search,
        category=category,
        page=page,
        page_size=pageSize,
    )


@router.get("/roles/{role_id}", response_model=RoleDetailResponse, dependencies=[Depends(require_permission("role", "VIEW", "ORGANIZATION"))])
async def get_role(role_id: int, service: RBACServiceDep, include_archived: bool = Query(False)) -> RoleDetailResponse:
    return await service.get_role(role_id, include_archived=include_archived)


@router.patch("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    body: RoleUpdate,
    service: RBACServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("role", "UPDATE", "ORGANIZATION"))],
) -> RoleResponse:
    return await service.update_role(role_id, body, actor_employment_id=auth.employment_id)


@router.delete("/roles/{role_id}", response_model=MessageResponse)
async def delete_role(
    role_id: int,
    service: RBACServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("role", "DELETE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.delete_role(role_id, actor_employment_id=auth.employment_id)


@router.post("/roles/{role_id}/restore", response_model=RoleResponse)
async def restore_role(
    role_id: int,
    service: RBACServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("role", "UPDATE", "ORGANIZATION"))],
) -> RoleResponse:
    """Q16: restore an archived role (409 when the name is taken)."""
    return await service.restore_role(role_id, actor_employment_id=auth.employment_id)


@router.post(
    "/roles/{role_id}/permissions",
    response_model=RolePermissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def grant_permission(
    role_id: int,
    body: RolePermissionGrant,
    service: RBACServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("role", "CREATE", "ORGANIZATION"))],
) -> RolePermissionResponse:
    return await service.grant_permission(role_id, body, actor_employment_id=auth.employment_id)


@router.delete(
    "/roles/{role_id}/permissions/{permission_id}/scopes/{scope_id}",
    response_model=MessageResponse,
)
async def revoke_permission(
    role_id: int,
    permission_id: int,
    scope_id: int,
    service: RBACServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("role", "DELETE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.revoke_permission(
        role_id, permission_id, scope_id, actor_employment_id=auth.employment_id
    )


@router.post(
    "/employments/{employment_id}/roles",
    response_model=EmployeeRoleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def assign_role(
    employment_id: int,
    body: AssignRoleRequest,
    service: RBACServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("role", "CREATE", "ORGANIZATION"))],
) -> EmployeeRoleResponse:
    return await service.assign_role(
        employment_id, body, actor_employment_id=auth.employment_id
    )


@router.delete(
    "/employments/{employment_id}/roles/{role_id}",
    response_model=MessageResponse,
)
async def unassign_role(
    employment_id: int,
    role_id: int,
    service: RBACServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("role", "DELETE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.unassign_role(
        employment_id, role_id, actor_employment_id=auth.employment_id
    )


@router.get(
    "/employments/{employment_id}/roles",
    response_model=list[EmployeeRoleResponse],
    dependencies=[Depends(require_permission("role", "VIEW", "ORGANIZATION"))],
)
async def list_roles_for_employment(
    employment_id: int,
    service: RBACServiceDep,
) -> list[EmployeeRoleResponse]:
    return await service.list_roles_for_employment(employment_id)


@router.get(
    "/employments/{employment_id}/effective-permissions",
    response_model=EffectivePermissionsResponse,
    dependencies=[Depends(require_permission("role", "VIEW", "ORGANIZATION"))],
)
async def get_effective_permissions(
    employment_id: int,
    service: RBACServiceDep,
) -> EffectivePermissionsResponse:
    return await service.get_effective_permissions(employment_id)


@router.put(
    "/roles/{role_id}/sensitive-fields",
    response_model=RoleSensitiveFieldPermissionResponse,
)
async def set_sensitive_field_permission(
    role_id: int,
    body: RoleSensitiveFieldPermissionSet,
    service: RBACServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("role", "UPDATE", "ORGANIZATION"))],
) -> RoleSensitiveFieldPermissionResponse:
    return await service.set_sensitive_field_permission(
        role_id, body, actor_employment_id=auth.employment_id
    )
