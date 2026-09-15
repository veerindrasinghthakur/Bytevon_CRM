"""RBACRepository — domain-specific queries only."""

from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repositories.base_repository import BaseRepository
from app.modules.rbac.models import (
    EmployeeRole,
    Permission,
    Resource,
    Role,
    RolePermission,
    RoleSensitiveFieldPermission,
    Scope,
    SensitiveField,
)


class RBACRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_resources(self) -> Sequence[Resource]:
        stmt = select(Resource).order_by(Resource.name)
        return await self.scalars(stmt)

    async def get_resource_by_id(self, resource_id: int) -> Optional[Resource]:
        stmt = select(Resource).where(Resource.id == resource_id)
        return await self.scalar_one_or_none(stmt)

    async def list_permissions(
        self, *, resource_id: Optional[int] = None
    ) -> Sequence[Permission]:
        stmt = select(Permission).order_by(Permission.resource_id, Permission.action)
        if resource_id is not None:
            stmt = stmt.where(Permission.resource_id == resource_id)
        return await self.scalars(stmt)

    async def get_permission_by_id(self, permission_id: int) -> Optional[Permission]:
        stmt = select(Permission).where(Permission.id == permission_id)
        return await self.scalar_one_or_none(stmt)

    async def list_scopes(self) -> Sequence[Scope]:
        stmt = select(Scope).order_by(Scope.name)
        return await self.scalars(stmt)

    async def get_scope_by_id(self, scope_id: int) -> Optional[Scope]:
        stmt = select(Scope).where(Scope.id == scope_id)
        return await self.scalar_one_or_none(stmt)

    async def get_scope_by_name(self, name: str) -> Optional[Scope]:
        stmt = select(Scope).where(Scope.name == name)
        return await self.scalar_one_or_none(stmt)

    async def list_sensitive_fields(
        self, *, resource_id: Optional[int] = None
    ) -> Sequence[SensitiveField]:
        stmt = select(SensitiveField).order_by(SensitiveField.field_key)
        if resource_id is not None:
            stmt = stmt.where(SensitiveField.resource_id == resource_id)
        return await self.scalars(stmt)

    async def get_sensitive_field_by_id(
        self, field_id: int
    ) -> Optional[SensitiveField]:
        stmt = select(SensitiveField).where(SensitiveField.id == field_id)
        return await self.scalar_one_or_none(stmt)

    async def get_role_by_id(
        self, role_id: int, *, with_details: bool = False
    ) -> Optional[Role]:
        stmt = select(Role).where(Role.id == role_id)
        if with_details:
            stmt = stmt.options(
                selectinload(Role.role_permissions)
                .selectinload(RolePermission.permission)
                .selectinload(Permission.resource),
                selectinload(Role.role_permissions).selectinload(RolePermission.scope),
                selectinload(Role.sensitive_field_permissions),
            )
        return await self.scalar_one_or_none(stmt)

    async def get_role_by_name(self, name: str) -> Optional[Role]:
        stmt = select(Role).where(Role.name == name)
        return await self.scalar_one_or_none(stmt)

    def _role_filter_stmt(
        self,
        *,
        search: Optional[str] = None,
        is_system_role: Optional[bool] = None,
    ):
        stmt = select(Role)
        if search and search.strip():
            q = f"%{search.strip()}%"
            stmt = stmt.where(or_(Role.name.ilike(q), Role.description.ilike(q)))
        if is_system_role is not None:
            stmt = stmt.where(Role.is_system_role.is_(is_system_role))
        return stmt

    async def count_roles(
        self,
        *,
        search: Optional[str] = None,
        is_system_role: Optional[bool] = None,
    ) -> int:
        base = self._role_filter_stmt(search=search, is_system_role=is_system_role)
        stmt = select(func.count()).select_from(base.subquery())
        result = await self.execute(stmt)
        return int(result.scalar() or 0)

    async def list_roles(
        self,
        *,
        with_details: bool = False,
        search: Optional[str] = None,
        is_system_role: Optional[bool] = None,
        skip: int = 0,
        limit: Optional[int] = None,
    ) -> Sequence[Role]:
        stmt = self._role_filter_stmt(search=search, is_system_role=is_system_role)
        stmt = stmt.order_by(Role.name)
        if with_details:
            stmt = stmt.options(
                selectinload(Role.role_permissions)
                .selectinload(RolePermission.permission)
                .selectinload(Permission.resource),
                selectinload(Role.role_permissions).selectinload(RolePermission.scope),
            )
        if skip:
            stmt = stmt.offset(skip)
        if limit is not None:
            stmt = stmt.limit(limit)
        return await self.scalars(stmt)

    async def count_employments_with_role(self, role_id: int) -> int:
        stmt = select(func.count()).select_from(EmployeeRole).where(
            EmployeeRole.role_id == role_id
        )
        result = await self.execute(stmt)
        return int(result.scalar() or 0)

    async def count_employments_by_role_ids(self, role_ids: list[int]) -> dict[int, int]:
        if not role_ids:
            return {}
        stmt = (
            select(EmployeeRole.role_id, func.count())
            .where(EmployeeRole.role_id.in_(role_ids))
            .group_by(EmployeeRole.role_id)
        )
        result = await self.execute(stmt)
        return {int(rid): int(cnt) for rid, cnt in result.all()}

    async def get_role_permission(
        self, role_id: int, permission_id: int, scope_id: int
    ) -> Optional[RolePermission]:
        stmt = select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
            RolePermission.scope_id == scope_id,
        )
        return await self.scalar_one_or_none(stmt)

    async def list_role_permissions(self, role_id: int) -> Sequence[RolePermission]:
        stmt = select(RolePermission).where(RolePermission.role_id == role_id)
        return await self.scalars(stmt)

    async def delete_role_permission(
        self, role_id: int, permission_id: int, scope_id: int
    ) -> None:
        stmt = delete(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
            RolePermission.scope_id == scope_id,
        )
        await self.execute(stmt)

    async def delete_all_role_permissions(self, role_id: int) -> None:
        stmt = delete(RolePermission).where(RolePermission.role_id == role_id)
        await self.execute(stmt)

    async def get_employee_role(
        self, employment_id: int, role_id: int
    ) -> Optional[EmployeeRole]:
        stmt = select(EmployeeRole).where(
            EmployeeRole.employment_id == employment_id,
            EmployeeRole.role_id == role_id,
        )
        return await self.scalar_one_or_none(stmt)

    async def list_roles_for_employment(
        self, employment_id: int
    ) -> Sequence[EmployeeRole]:
        stmt = (
            select(EmployeeRole)
            .where(EmployeeRole.employment_id == employment_id)
            .options(selectinload(EmployeeRole.role))
        )
        return await self.scalars(stmt)

    async def list_employments_for_role(
        self, role_id: int
    ) -> Sequence[EmployeeRole]:
        stmt = select(EmployeeRole).where(EmployeeRole.role_id == role_id)
        return await self.scalars(stmt)

    async def delete_employee_role(self, employment_id: int, role_id: int) -> None:
        stmt = delete(EmployeeRole).where(
            EmployeeRole.employment_id == employment_id,
            EmployeeRole.role_id == role_id,
        )
        await self.execute(stmt)

    async def get_role_sensitive_field_permission(
        self, role_id: int, sensitive_field_id: int
    ) -> Optional[RoleSensitiveFieldPermission]:
        stmt = select(RoleSensitiveFieldPermission).where(
            RoleSensitiveFieldPermission.role_id == role_id,
            RoleSensitiveFieldPermission.sensitive_field_id == sensitive_field_id,
        )
        return await self.scalar_one_or_none(stmt)

    async def list_role_sensitive_field_permissions(
        self, role_id: int
    ) -> Sequence[RoleSensitiveFieldPermission]:
        stmt = select(RoleSensitiveFieldPermission).where(
            RoleSensitiveFieldPermission.role_id == role_id
        )
        return await self.scalars(stmt)

    async def load_effective_permissions_for_employment(
        self, employment_id: int
    ) -> Sequence[tuple]:
        stmt = (
            select(
                Resource.name,
                Permission.action,
                Scope.name,
                Role.name,
            )
            .select_from(EmployeeRole)
            .join(Role, Role.id == EmployeeRole.role_id)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .join(Permission, Permission.id == RolePermission.permission_id)
            .join(Resource, Resource.id == Permission.resource_id)
            .join(Scope, Scope.id == RolePermission.scope_id)
            .where(EmployeeRole.employment_id == employment_id)
        )
        result = await self.execute(stmt)
        return result.all()
