"""
Pydantic v2 schemas for RBAC module.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import Action


class MessageResponse(BaseModel):
    message: str


# ===========================================================================
# Seeded / read-only surfaces
# ===========================================================================

class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    created_at: datetime


class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resource_id: int
    action: Action
    created_at: datetime


class ScopeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    created_at: datetime


class SensitiveFieldResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    field_key: str
    resource_id: int
    created_at: datetime


# ===========================================================================
# Roles
# ===========================================================================

class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    is_system_role: bool = False
    permission_ids: List[int] = Field(default_factory=list)
    scope_id: Optional[int] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None
    scope_id: Optional[int] = None


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    is_system_role: bool
    created_at: datetime
    changed_by: Optional[int]


class RoleListItemResponse(RoleResponse):
    """List payload enriched for admin role cards."""

    usersCount: int = 0
    permission_count: int = 0
    permission_keys: List[str] = Field(default_factory=list)


class RolePermissionDetail(BaseModel):
    """Flattened grant for UI matrix (resource.action string + ids)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    permission_id: int
    scope_id: int
    resource_name: Optional[str] = None
    action: Optional[str] = None
    scope_name: Optional[str] = None
    key: Optional[str] = None


class RoleDetailResponse(RoleResponse):
    permissions: List[RolePermissionResponse] = Field(default_factory=list)
    permission_details: List[RolePermissionDetail] = Field(default_factory=list)
    permission_keys: List[str] = Field(default_factory=list)
    usersCount: int = 0
    sensitive_field_permissions: List["RoleSensitiveFieldPermissionResponse"] = Field(
        default_factory=list
    )


# ===========================================================================
# Role ↔ Permission ↔ Scope
# ===========================================================================

class RolePermissionGrant(BaseModel):
    permission_id: int
    scope_id: int


class RolePermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_id: int
    permission_id: int
    scope_id: int
    created_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Employee ↔ Role
# ===========================================================================

class AssignRoleRequest(BaseModel):
    role_id: int


class EmployeeRoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    role_id: int
    assigned_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Sensitive field permissions
# ===========================================================================

class RoleSensitiveFieldPermissionSet(BaseModel):
    sensitive_field_id: int
    can_read: bool = False
    can_update: bool = False


class RoleSensitiveFieldPermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_id: int
    sensitive_field_id: int
    can_read: bool
    can_update: bool
    created_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Effective permissions for an employment
# ===========================================================================

class EffectivePermissionItem(BaseModel):
    resource_name: str
    action: Action
    scope_name: str


class EffectivePermissionsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    employment_id: int = Field(..., serialization_alias="employmentId")
    is_super_admin: bool = Field(False, serialization_alias="isSuperAdmin")
    roles: List[str] = Field(default_factory=list)
    permissions: dict[str, dict[str, bool]] = Field(default_factory=dict)
    scope: str = "SELF"
    scope_by_resource: dict[str, str] = Field(
        default_factory=dict, serialization_alias="scopeByResource"
    )
    grants: List[EffectivePermissionItem] = Field(default_factory=list)
