"""
RBAC ORM models.

Tables:
  resources, permissions, scopes, roles, role_permissions,
  employee_roles, sensitive_fields, role_sensitive_field_permissions

Schema source: Complete_Final_Schema.md §4 RBAC.
Seeded tables (resources, permissions, scopes, sensitive_fields) are read-mostly.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import ArchiveMixin, Base, CreatedAtMixin, IdentityMixin
from app.core.db.enums import Action

# ---------------------------------------------------------------------------
# resources 🟪 (seeded)
# ---------------------------------------------------------------------------

class Resource(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "resources"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    permissions: Mapped[list[Permission]] = relationship(
        "Permission", back_populates="resource"
    )
    sensitive_fields: Mapped[list[SensitiveField]] = relationship(
        "SensitiveField", back_populates="resource"
    )


# ---------------------------------------------------------------------------
# permissions 🟪 (seeded) — Resource + Action
# ---------------------------------------------------------------------------

class Permission(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint("resource_id", "action", name="uq_permissions_resource_action"),
    )

    resource_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("resources.id"), nullable=False, index=True
    )
    action: Mapped[Action] = mapped_column(nullable=False)

    resource: Mapped[Resource] = relationship("Resource", back_populates="permissions")


# ---------------------------------------------------------------------------
# scopes 🟪 (seeded)
# ---------------------------------------------------------------------------

class Scope(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "scopes"

    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


# ---------------------------------------------------------------------------
# roles 🟨
# ---------------------------------------------------------------------------

class Role(Base, IdentityMixin, ArchiveMixin, CreatedAtMixin):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("name", name="uq_roles_name"),)

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_system_role: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)

    role_permissions: Mapped[list[RolePermission]] = relationship(
        "RolePermission",
        back_populates="role",
        cascade="all, delete-orphan",
    )
    employee_roles: Mapped[list[EmployeeRole]] = relationship(
        "EmployeeRole",
        back_populates="role",
        cascade="all, delete-orphan",
    )
    sensitive_field_permissions: Mapped[list[RoleSensitiveFieldPermission]] = relationship(
        "RoleSensitiveFieldPermission",
        back_populates="role",
        cascade="all, delete-orphan",
    )


# ---------------------------------------------------------------------------
# role_permissions 🟨  PK = (role_id, permission_id, scope_id)
# ---------------------------------------------------------------------------

class RolePermission(Base, CreatedAtMixin):
    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint(
            "role_id",
            "permission_id",
            "scope_id",
            name="uq_role_permissions_role_perm_scope",
        ),
    )

    # Composite natural key; also expose a surrogate for ORM convenience if needed
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id"), nullable=False, index=True
    )
    permission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("permissions.id"), nullable=False, index=True
    )
    scope_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("scopes.id"), nullable=False, index=True
    )
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)

    role: Mapped[Role] = relationship("Role", back_populates="role_permissions")
    permission: Mapped[Permission] = relationship("Permission")
    scope: Mapped[Scope] = relationship("Scope")


# ---------------------------------------------------------------------------
# employee_roles 🟨  PK = (employment_id, role_id)
# ---------------------------------------------------------------------------

class EmployeeRole(Base):
    __tablename__ = "employee_roles"
    __table_args__ = (
        UniqueConstraint(
            "employment_id", "role_id", name="uq_employee_roles_employment_role"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id"), nullable=False, index=True
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)

    role: Mapped[Role] = relationship("Role", back_populates="employee_roles")


# ---------------------------------------------------------------------------
# sensitive_fields 🟪 (seeded)
# ---------------------------------------------------------------------------

class SensitiveField(Base, IdentityMixin, CreatedAtMixin):
    __tablename__ = "sensitive_fields"
    __table_args__ = (
        UniqueConstraint("field_key", name="uq_sensitive_fields_field_key"),
    )

    field_key: Mapped[str] = mapped_column(String(150), nullable=False)
    resource_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("resources.id"), nullable=False, index=True
    )

    resource: Mapped[Resource] = relationship(
        "Resource", back_populates="sensitive_fields"
    )


# ---------------------------------------------------------------------------
# role_sensitive_field_permissions 🟨  PK = (role_id, sensitive_field_id)
# ---------------------------------------------------------------------------

class RoleSensitiveFieldPermission(Base, CreatedAtMixin):
    __tablename__ = "role_sensitive_field_permissions"
    __table_args__ = (
        UniqueConstraint(
            "role_id",
            "sensitive_field_id",
            name="uq_role_sensitive_field_role_field",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id"), nullable=False, index=True
    )
    sensitive_field_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sensitive_fields.id"), nullable=False, index=True
    )
    can_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    can_update: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)

    role: Mapped[Role] = relationship(
        "Role", back_populates="sensitive_field_permissions"
    )
    sensitive_field: Mapped[SensitiveField] = relationship("SensitiveField")
