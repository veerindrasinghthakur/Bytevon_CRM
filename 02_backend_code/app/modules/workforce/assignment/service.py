"""AssignmentService — assignments + employment state transitions."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import EmploymentState
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.organization.models import Department, Location, Shift
from app.modules.workforce.models import EmploymentAssignment, EmploymentStateHistory
from app.modules.workforce.assignment.repository import AssignmentRepository
from app.modules.workforce.assignment.schemas import (
    EmploymentAssignmentCreate,
    EmploymentAssignmentResponse,
    EmploymentStateChangeRequest,
    EmploymentStateHistoryResponse,
)


def _optional_id(value: Optional[int]) -> Optional[int]:
    if value is None or value <= 0:
        return None
    return value


class AssignmentService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = AssignmentRepository(session)

    async def _validate_assignment_refs(
        self,
        *,
        department_id: Optional[int],
        position_id: Optional[int],
        location_id: Optional[int],
        shift_id: Optional[int],
    ) -> tuple[Optional[int], Optional[int], Optional[int], Optional[int]]:
        department_id = _optional_id(department_id)
        position_id = _optional_id(position_id)
        location_id = _optional_id(location_id)
        shift_id = _optional_id(shift_id)
        if department_id is not None:
            if await self._session.get(Department, department_id) is None:
                raise NotFoundError(f"Department not found (id={department_id})")
        if position_id is not None:
            if await self._repo.get_position_by_id(position_id) is None:
                raise NotFoundError(f"Position not found (id={position_id})")
        if location_id is not None:
            if await self._session.get(Location, location_id) is None:
                raise NotFoundError(f"Location not found (id={location_id})")
        if shift_id is not None:
            if await self._session.get(Shift, shift_id) is None:
                raise NotFoundError(f"Shift not found (id={shift_id})")
        return department_id, position_id, location_id, shift_id

    async def change_state(
        self,
        employment_id: int,
        data: EmploymentStateChangeRequest,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> EmploymentStateHistoryResponse:
        emp = await self._repo.get_employment_by_id(employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")
        if data.new_state == emp.current_state:
            raise DomainError(f"Employment is already in state {data.new_state.value}")
        terminal = {
            EmploymentState.RESIGNED,
            EmploymentState.TERMINATED,
            EmploymentState.ALUMNI,
        }
        if emp.current_state in terminal and data.new_state not in terminal:
            raise DomainError(
                f"Cannot move from terminal state {emp.current_state.value} to {data.new_state.value}"
            )
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        history = EmploymentStateHistory(
            employment_id=emp.id,
            previous_state=emp.current_state,
            new_state=data.new_state,
            effective_date=data.effective_date,
            reason=data.reason,
            changed_by=actor,
        )
        await self._repo.add(history)
        emp.current_state = data.new_state
        emp.changed_by = actor
        await self._commit()
        await self._audit("employment.state_changed", emp.id, actor_employment_id)
        await self._session.refresh(history)
        return EmploymentStateHistoryResponse.model_validate(history)

    async def list_state_history(
        self, employment_id: int, *, limit: int = 50
    ) -> list[EmploymentStateHistoryResponse]:
        if await self._repo.get_employment_by_id(employment_id) is None:
            raise NotFoundError("Employment not found")
        rows = await self._repo.list_state_history(employment_id, limit=limit)
        return [EmploymentStateHistoryResponse.model_validate(r) for r in rows]

    async def create_assignment(
        self,
        employment_id: int,
        data: EmploymentAssignmentCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> EmploymentAssignmentResponse:
        if await self._repo.get_employment_by_id(employment_id) is None:
            raise NotFoundError("Employment not found")
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        dept_id, pos_id, loc_id, shift_id = await self._validate_assignment_refs(
            department_id=data.department_id,
            position_id=data.position_id,
            location_id=data.location_id,
            shift_id=data.shift_id,
        )
        current = await self._repo.get_current_assignment(
            employment_id, as_of=data.effective_from
        )
        if current and current.effective_to is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_assignment(current.id, close_to)
            else:
                await self._repo.close_assignment(current.id, data.effective_from)
        assignment = EmploymentAssignment(
            employment_id=employment_id,
            department_id=dept_id,
            position_id=pos_id,
            location_id=loc_id,
            shift_id=shift_id,
            work_mode=data.work_mode,
            effective_from=data.effective_from,
            effective_to=None,
            change_reason=data.change_reason,
            changed_by=actor,
        )
        await self._repo.add(assignment)
        await self._commit()
        await self._audit("employment.assignment_created", assignment.id, actor_employment_id)
        await self._session.refresh(assignment)
        return EmploymentAssignmentResponse.model_validate(assignment)

    async def get_current_assignment(
        self, employment_id: int, *, as_of: Optional[date] = None
    ) -> EmploymentAssignmentResponse:
        if await self._repo.get_employment_by_id(employment_id) is None:
            raise NotFoundError("Employment not found")
        asg = await self._repo.get_current_assignment(employment_id, as_of=as_of)
        if asg is None:
            raise NotFoundError("No current assignment found")
        return EmploymentAssignmentResponse.model_validate(asg)

    async def list_assignments(
        self, employment_id: int
    ) -> list[EmploymentAssignmentResponse]:
        if await self._repo.get_employment_by_id(employment_id) is None:
            raise NotFoundError("Employment not found")
        rows = await self._repo.list_assignments(employment_id)
        return [EmploymentAssignmentResponse.model_validate(r) for r in rows]
