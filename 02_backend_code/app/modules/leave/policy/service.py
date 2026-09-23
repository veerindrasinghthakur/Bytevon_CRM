"""PolicyService — versioned leave policies (FK to leave_types)."""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.leave.leave_type.repository import LeaveTypeRepository
from app.modules.leave.models import LeavePolicy
from app.modules.leave.policy.repository import PolicyRepository
from app.modules.leave.policy.schemas import LeavePolicyCreate, LeavePolicyResponse


class PolicyService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = PolicyRepository(session)
        self._types = LeaveTypeRepository(session)

    def _to_response(self, policy: LeavePolicy, code: str) -> LeavePolicyResponse:
        return LeavePolicyResponse(
            id=policy.id,
            name=policy.name,
            leave_type_id=policy.leave_type_id,
            leave_type=code,
            annual_entitlement=policy.annual_entitlement,
            carry_forward_limit=policy.carry_forward_limit,
            effective_from=policy.effective_from,
            effective_to=policy.effective_to,
            created_at=policy.created_at,
            changed_by=policy.changed_by,
        )

    async def _resolve_code(self, code: str):
        from app.modules.leave.leave_type.service import LeaveTypeService

        return await LeaveTypeService(self._session).resolve_active_code(code)

    async def create_policy(
        self,
        data: LeavePolicyCreate,
        *,
        actor_employment_id: int | None = None,
    ) -> LeavePolicyResponse:
        type_row = await self._resolve_code(data.leave_type)
        current = await self._repo.get_current_policy(
            type_row.id, as_of=data.effective_from
        )
        if current and current.effective_to is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_policy(current.id, close_to)

        entitlement: Decimal = (
            data.annual_entitlement
            if data.annual_entitlement is not None
            else type_row.default_annual_entitlement
        )
        policy = LeavePolicy(
            name=data.name,
            leave_type_id=type_row.id,
            annual_entitlement=entitlement,
            carry_forward_limit=data.carry_forward_limit,
            effective_from=data.effective_from,
            effective_to=None,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(policy)
        await self._commit()
        await self._audit("leave_policy.created", policy.id, actor_employment_id)
        return self._to_response(policy, type_row.code)

    async def list_policies(
        self, *, leave_type: str | None = None
    ) -> list[LeavePolicyResponse]:
        type_id: int | None = None
        if leave_type is not None:
            type_row = await self._resolve_code(leave_type)
            type_id = type_row.id
        rows = await self._repo.list_policies(leave_type_id=type_id)
        codes = await self._types.code_map_for({r.leave_type_id for r in rows})
        return [
            self._to_response(r, codes.get(r.leave_type_id, "?")) for r in rows
        ]

    async def get_current_policy(
        self, leave_type: str, *, as_of: date | None = None
    ) -> LeavePolicyResponse:
        type_row = await self._resolve_code(leave_type)
        policy = await self._repo.get_current_policy(type_row.id, as_of=as_of)
        if policy is None:
            raise NotFoundError(f"No effective policy for {type_row.code}")
        return self._to_response(policy, type_row.code)
