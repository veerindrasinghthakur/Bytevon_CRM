"""PolicyService — versioned leave policies."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import LeaveType
from app.core.exceptions.exception import NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.leave.models import LeavePolicy
from app.modules.leave.policy.repository import PolicyRepository
from app.modules.leave.policy.schemas import LeavePolicyCreate, LeavePolicyResponse


class PolicyService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = PolicyRepository(session)

    async def create_policy(
        self,
        data: LeavePolicyCreate,
        *,
        actor_employment_id: int | None = None,
    ) -> LeavePolicyResponse:
        current = await self._repo.get_current_policy(
            data.leave_type, as_of=data.effective_from
        )
        if current and current.effective_to is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_policy(current.id, close_to)

        policy = LeavePolicy(
            name=data.name,
            leave_type=data.leave_type,
            annual_entitlement=data.annual_entitlement,
            carry_forward_limit=data.carry_forward_limit,
            effective_from=data.effective_from,
            effective_to=None,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(policy)
        await self._commit()
        await self._audit("leave_policy.created", policy.id, actor_employment_id)
        return LeavePolicyResponse.model_validate(policy)

    async def list_policies(
        self, *, leave_type: LeaveType | None = None
    ) -> list[LeavePolicyResponse]:
        rows = await self._repo.list_policies(leave_type=leave_type)
        return [LeavePolicyResponse.model_validate(r) for r in rows]

    async def get_current_policy(
        self, leave_type: LeaveType, *, as_of: date | None = None
    ) -> LeavePolicyResponse:
        policy = await self._repo.get_current_policy(leave_type, as_of=as_of)
        if policy is None:
            raise NotFoundError(f"No effective policy for {leave_type.value}")
        return LeavePolicyResponse.model_validate(policy)
