"""
EmploymentPublicService — only public entry point for Employment.

Owns the transaction. State history and assignments are append-only.
current_state on employments is updated as a denormalized cache when history is appended.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import EmploymentState
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.employment.models import (
    Employment,
    EmploymentAssignment,
    EmploymentStateHistory,
    Position,
)
from app.modules.employment.repositories.repository import EmploymentRepository
from app.modules.employment.schemas.schemas import (
    EmploymentAssignmentCreate,
    EmploymentAssignmentResponse,
    EmploymentCreate,
    EmploymentDetailResponse,
    EmploymentResponse,
    EmploymentStateChangeRequest,
    EmploymentStateHistoryResponse,
    EmploymentUpdate,
    MessageResponse,
    PositionCreate,
    PositionResponse,
    PositionUpdate,
)

logger = logging.getLogger(__name__)


class EmploymentPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = EmploymentRepository(session)

    # ==================================================================
    # Positions
    # ==================================================================

    async def create_position(
        self,
        data: PositionCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> PositionResponse:
        existing = await self._repo.get_position_by_name(data.name)
        if existing:
            raise ConflictError(f"Position '{data.name}' already exists")

        pos = Position(name=data.name)
        await self._repo.add(pos)
        await self._commit()
        await self._audit("position.created", pos.id, actor_employment_id)
        return PositionResponse.model_validate(pos)

    async def get_position(self, position_id: int) -> PositionResponse:
        pos = await self._repo.get_position_by_id(position_id)
        if pos is None:
            raise NotFoundError("Position not found")
        return PositionResponse.model_validate(pos)

    async def list_positions(
        self, *, include_archived: bool = False
    ) -> list[PositionResponse]:
        rows = await self._repo.list_positions(include_archived=include_archived)
        return [PositionResponse.model_validate(r) for r in rows]

    async def update_position(
        self,
        position_id: int,
        data: PositionUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> PositionResponse:
        pos = await self._repo.get_position_by_id(position_id)
        if pos is None:
            raise NotFoundError("Position not found")
        if data.name is not None and data.name != pos.name:
            clash = await self._repo.get_position_by_name(data.name)
            if clash and clash.id != position_id:
                raise ConflictError(f"Position '{data.name}' already exists")
            pos.name = data.name
        await self._commit()
        await self._audit("position.updated", pos.id, actor_employment_id)
        return PositionResponse.model_validate(pos)

    async def archive_position(
        self,
        position_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MessageResponse:
        pos = await self._repo.get_position_by_id(position_id)
        if pos is None:
            raise NotFoundError("Position not found")
        if pos.is_archived:
            raise DomainError("Position is already archived")

        now = datetime.now(timezone.utc)
        pos.is_archived = True
        pos.archived_at = now
        pos.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("position.archived", pos.id, actor_employment_id)
        return MessageResponse(message="Position archived")

    # ==================================================================
    # Employment lifecycle
    # ==================================================================

    async def create_employment(
        self,
        data: EmploymentCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> EmploymentDetailResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID

        existing_code = await self._repo.get_employment_by_code(data.employee_code)
        if existing_code:
            raise ConflictError(f"Employee code '{data.employee_code}' already exists")

        # Person existence is validated via public API of Auth when available;
        # for now we only enforce the FK at DB level.
        emp = Employment(
            person_id=data.person_id,
            employee_code=data.employee_code,
            employment_type=data.employment_type,
            current_state=data.initial_state,
            joining_date=data.joining_date,
            changed_by=actor,
        )
        await self._repo.add(emp)
        await self._flush()  # need emp.id

        # Initial state history row
        history = EmploymentStateHistory(
            employment_id=emp.id,
            previous_state=None,
            new_state=data.initial_state,
            effective_date=data.joining_date,
            reason=data.initial_state_reason or "Initial employment",
            changed_by=actor,
        )
        await self._repo.add(history)

        # Optional initial assignment
        current_assignment = None
        if any(
            [
                data.department_id,
                data.position_id,
                data.location_id,
                data.shift_id,
                data.work_mode,
            ]
        ):
            if data.work_mode is None:
                raise DomainError("work_mode is required when creating an assignment")
            if not data.assignment_change_reason:
                raise DomainError(
                    "assignment_change_reason is required when creating an assignment"
                )
            assignment = EmploymentAssignment(
                employment_id=emp.id,
                department_id=data.department_id,
                position_id=data.position_id,
                location_id=data.location_id,
                shift_id=data.shift_id,
                work_mode=data.work_mode,
                effective_from=data.joining_date,
                effective_to=None,
                change_reason=data.assignment_change_reason,
                changed_by=actor,
            )
            await self._repo.add(assignment)
            current_assignment = assignment

        await self._commit()
        await self._audit("employment.created", emp.id, actor_employment_id)

        return EmploymentDetailResponse(
            **EmploymentResponse.model_validate(emp).model_dump(),
            current_assignment=(
                EmploymentAssignmentResponse.model_validate(current_assignment)
                if current_assignment
                else None
            ),
            recent_state_history=[
                EmploymentStateHistoryResponse.model_validate(history)
            ],
        )

    async def get_employment(self, employment_id: int) -> EmploymentDetailResponse:
        emp = await self._repo.get_employment_by_id(employment_id, with_relations=True)
        if emp is None:
            raise NotFoundError("Employment not found")

        current_asg = await self._repo.get_current_assignment(employment_id)
        history = await self._repo.list_state_history(employment_id, limit=10)

        return EmploymentDetailResponse(
            **EmploymentResponse.model_validate(emp).model_dump(),
            current_assignment=(
                EmploymentAssignmentResponse.model_validate(current_asg)
                if current_asg
                else None
            ),
            recent_state_history=[
                EmploymentStateHistoryResponse.model_validate(h) for h in history
            ],
        )

    async def list_employments(
        self,
        *,
        state: Optional[EmploymentState] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[EmploymentResponse]:
        rows = await self._repo.list_employments(
            state=state.value if state else None,
            limit=limit,
            offset=offset,
        )
        return [EmploymentResponse.model_validate(r) for r in rows]

    async def list_employments_by_person(
        self, person_id: int
    ) -> list[EmploymentResponse]:
        rows = await self._repo.list_employments_by_person(person_id)
        return [EmploymentResponse.model_validate(r) for r in rows]

    async def update_employment(
        self,
        employment_id: int,
        data: EmploymentUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> EmploymentResponse:
        emp = await self._repo.get_employment_by_id(employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")

        if data.employee_code is not None and data.employee_code != emp.employee_code:
            clash = await self._repo.get_employment_by_code(data.employee_code)
            if clash:
                raise ConflictError(
                    f"Employee code '{data.employee_code}' already exists"
                )
            emp.employee_code = data.employee_code

        if data.employment_type is not None:
            emp.employment_type = data.employment_type

        emp.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("employment.updated", emp.id, actor_employment_id)
        return EmploymentResponse.model_validate(emp)

    # ==================================================================
    # State transitions (append-only history)
    # ==================================================================

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

        # Basic transition guards (can be expanded later)
        terminal = {EmploymentState.RESIGNED, EmploymentState.TERMINATED, EmploymentState.ALUMNI}
        if emp.current_state in terminal and data.new_state not in terminal:
            raise DomainError(
                f"Cannot move from terminal state {emp.current_state.value} to {data.new_state.value}"
            )

        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        previous = emp.current_state

        history = EmploymentStateHistory(
            employment_id=emp.id,
            previous_state=previous,
            new_state=data.new_state,
            effective_date=data.effective_date,
            reason=data.reason,
            changed_by=actor,
        )
        await self._repo.add(history)

        # Keep denormalized current_state in sync
        emp.current_state = data.new_state
        emp.changed_by = actor

        await self._commit()
        await self._audit("employment.state_changed", emp.id, actor_employment_id)
        return EmploymentStateHistoryResponse.model_validate(history)

    async def list_state_history(
        self, employment_id: int, *, limit: int = 50
    ) -> list[EmploymentStateHistoryResponse]:
        emp = await self._repo.get_employment_by_id(employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")
        rows = await self._repo.list_state_history(employment_id, limit=limit)
        return [EmploymentStateHistoryResponse.model_validate(r) for r in rows]

    # ==================================================================
    # Assignments (close previous + insert new)
    # ==================================================================

    async def create_assignment(
        self,
        employment_id: int,
        data: EmploymentAssignmentCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> EmploymentAssignmentResponse:
        emp = await self._repo.get_employment_by_id(employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")

        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID

        # Close any currently open assignment
        current = await self._repo.get_current_assignment(
            employment_id, as_of=data.effective_from
        )
        if current and current.effective_to is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_assignment(current.id, close_to)
            else:
                # Same-day change: close previous on the same day
                await self._repo.close_assignment(current.id, data.effective_from)

        assignment = EmploymentAssignment(
            employment_id=employment_id,
            department_id=data.department_id,
            position_id=data.position_id,
            location_id=data.location_id,
            shift_id=data.shift_id,
            work_mode=data.work_mode,
            effective_from=data.effective_from,
            effective_to=None,
            change_reason=data.change_reason,
            changed_by=actor,
        )
        await self._repo.add(assignment)
        await self._commit()
        await self._audit("employment.assignment_created", assignment.id, actor_employment_id)
        return EmploymentAssignmentResponse.model_validate(assignment)

    async def get_current_assignment(
        self, employment_id: int, *, as_of: Optional[date] = None
    ) -> EmploymentAssignmentResponse:
        emp = await self._repo.get_employment_by_id(employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")
        asg = await self._repo.get_current_assignment(employment_id, as_of=as_of)
        if asg is None:
            raise NotFoundError("No current assignment found")
        return EmploymentAssignmentResponse.model_validate(asg)

    async def list_assignments(
        self, employment_id: int
    ) -> list[EmploymentAssignmentResponse]:
        emp = await self._repo.get_employment_by_id(employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")
        rows = await self._repo.list_assignments(employment_id)
        return [EmploymentAssignmentResponse.model_validate(r) for r in rows]

    # ==================================================================
    # Helpers
    # ==================================================================

