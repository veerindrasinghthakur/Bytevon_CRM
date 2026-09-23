"""LeaveTypeService — master catalog CRUD (create / update / soft-delete)."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.leave.leave_type.repository import LeaveTypeRepository
from app.modules.leave.leave_type.schemas import (
    LeaveTypeCreate,
    LeaveTypeResponse,
    LeaveTypeUpdate,
)
from app.modules.leave.models import LeaveType


class LeaveTypeService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = LeaveTypeRepository(session)

    async def create_type(
        self,
        data: LeaveTypeCreate,
        *,
        actor_employment_id: int | None = None,
    ) -> LeaveTypeResponse:
        existing = await self._repo.get_by_code(data.code)
        if existing is not None:
            raise ConflictError(f"Leave type '{data.code}' already exists")
        row = LeaveType(
            code=data.code,
            name=data.name,
            description=data.description,
            is_paid=data.is_paid,
            requires_approval=data.requires_approval,
            requires_document=data.requires_document,
            allow_half_day=data.allow_half_day,
            allow_hourly=data.allow_hourly,
            is_encashable=data.is_encashable,
            default_annual_entitlement=data.default_annual_entitlement,
            is_active=data.is_active,
            sort_order=data.sort_order,
        )
        await self._repo.add(row)
        await self._commit()
        await self._refresh(row)
        await self._audit("leave_type.created", row.id, actor_employment_id)
        return LeaveTypeResponse.model_validate(row)

    async def list_types(
        self, *, include_archived: bool = False
    ) -> list[LeaveTypeResponse]:
        rows = await self._repo.list_types(include_archived=include_archived)
        return [LeaveTypeResponse.model_validate(r) for r in rows]

    async def get_type(self, type_id: int) -> LeaveTypeResponse:
        row = await self._repo.get_by_id(type_id)
        if row is None:
            raise NotFoundError("Leave type not found")
        return LeaveTypeResponse.model_validate(row)

    async def resolve_active_code(self, code: str) -> LeaveType:
        """Resolve a caller-supplied code to its live catalog row."""
        row = await self._repo.get_active_by_code(code)
        if row is None:
            known = await self._repo.get_by_code(code)
            if known is None:
                raise NotFoundError(f"Unknown leave type '{code}'")
            raise DomainError(f"Leave type '{known.code}' is not active")
        return row

    async def update_type(
        self,
        type_id: int,
        data: LeaveTypeUpdate,
        *,
        actor_employment_id: int | None = None,
    ) -> LeaveTypeResponse:
        row = await self._repo.get_by_id(type_id)
        if row is None:
            raise NotFoundError("Leave type not found")
        if row.deleted_at is not None:
            raise DomainError("Soft-deleted leave types cannot be updated")
        patch = data.model_dump(exclude_unset=True)
        for field, value in patch.items():
            setattr(row, field, value)
        await self._commit()
        await self._refresh(row)
        await self._audit("leave_type.updated", row.id, actor_employment_id)
        return LeaveTypeResponse.model_validate(row)

    async def soft_delete_type(
        self,
        type_id: int,
        *,
        actor_employment_id: int | None = None,
    ) -> LeaveTypeResponse:
        row = await self._repo.get_by_id(type_id)
        if row is None:
            raise NotFoundError("Leave type not found")
        if row.deleted_at is not None:
            raise DomainError("Leave type is already deleted")
        refs = await self._repo.count_references(type_id)
        if refs > 0:
            raise ConflictError(
                f"Leave type '{row.code}' is referenced by {refs} "
                "policies/requests/ledger rows and cannot be deleted"
            )
        row.deleted_at = datetime.now(timezone.utc)
        row.is_active = False
        await self._commit()
        await self._refresh(row)
        await self._audit("leave_type.deleted", row.id, actor_employment_id)
        return LeaveTypeResponse.model_validate(row)
