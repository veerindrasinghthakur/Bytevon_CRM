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


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    is_system_role: bool
    created_at: datetime
    changed_by: Optional[int]


class RoleDetailResponse(RoleResponse):
    permissions: List["RolePermissionResponse"] = Field(default_factory=list)
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
# Flat grants (BE tools) + nested tree (frontend useRbac / can)
# ===========================================================================

class EffectivePermissionItem(BaseModel):
    """One granted (resource, action, scope) triple."""

    resource_name: str
    action: Action
    scope_name: str


class EffectivePermissionsResponse(BaseModel):
    """
    Authorization payload for an employment.

    Nested `permissions` + `scope` + `scope_by_resource` match the frontend
    EffectiveAuthorization contract (camelCase aliases for JSON).
    Flat `grants` keeps the original list shape for admin/debug tools.
    """

    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    employment_id: int = Field(..., serialization_alias="employmentId")
    is_super_admin: bool = Field(False, serialization_alias="isSuperAdmin")
    roles: List[str] = Field(default_factory=list)
    # Nested: { "lead": { "view": true, "create": true }, ... }
    permissions: dict[str, dict[str, bool]] = Field(default_factory=dict)
    # Max scope across grants (SELF..ORGANIZATION)
    scope: str = "SELF"
    # Max scope per resource name
    scope_by_resource: dict[str, str] = Field(
        default_factory=dict, serialization_alias="scopeByResource"
    )
    # Flat list (backward compatible for internal tools)
    grants: List[EffectivePermissionItem] = Field(default_factory=list)
