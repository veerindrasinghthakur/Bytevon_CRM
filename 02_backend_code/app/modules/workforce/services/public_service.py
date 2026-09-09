"""
EmploymentPublicService — only public entry point for Workforce / Employment.

Owns the transaction. State history and assignments are append-only.
current_state on employments is updated as a denormalized cache when history is appended.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import EmploymentState
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.auth.models import Person
from app.modules.organization.models import Department, Location, Shift
from app.modules.workforce.models import (
    Employment,
    EmploymentAssignment,
    EmploymentStateHistory,
    Position,
)
from app.modules.workforce.repositories.repository import EmploymentRepository
from app.modules.workforce.schemas.schemas import (
    EmployeeCreate,
    EmploymentAssignmentCreate,
    EmploymentAssignmentResponse,
    EmploymentCreate,
    EmploymentDetailResponse,
    EmploymentResponse,
    EmploymentStateChangeRequest,
    EmploymentStateHistoryResponse,
    EmploymentUpdate,
    MessageResponse,
    PersonCreate,
    PersonResponse,
    PersonUpdate,
    PositionCreate,
    PositionResponse,
    PositionUpdate,
)

logger = logging.getLogger(__name__)


def _optional_id(value: Optional[int]) -> Optional[int]:
    """Treat 0 / negative as unset (Swagger often sends 0 for optional ints)."""
    if value is None or value <= 0:
        return None
    return value


class EmploymentPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = EmploymentRepository(session)

    async def _require_person(self, person_id: int) -> Person:
        person = await self._session.get(Person, person_id)
        if person is None:
            raise NotFoundError(f"Person not found (id={person_id})")
        return person

    async def _person_response(self, person: Person) -> PersonResponse:
        """Refresh so server-side updated_at/created_at are loaded after commit."""
        await self._session.refresh(person)
        return PersonResponse.model_validate(person)

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
            dept = await self._session.get(Department, department_id)
            if dept is None:
                raise NotFoundError(f"Department not found (id={department_id})")
        if position_id is not None:
            pos = await self._repo.get_position_by_id(position_id)
            if pos is None:
                raise NotFoundError(f"Position not found (id={position_id})")
        if location_id is not None:
            loc = await self._session.get(Location, location_id)
            if loc is None:
                raise NotFoundError(f"Location not found (id={location_id})")
        if shift_id is not None:
            shift = await self._session.get(Shift, shift_id)
            if shift is None:
                raise NotFoundError(f"Shift not found (id={shift_id})")

        return department_id, position_id, location_id, shift_id

    # ==================================================================
    # Persons
    # ==================================================================

    async def create_person(
        self,
        data: PersonCreate,
        *,
        actor_employment_id: Optional[int] = None,
        commit: bool = True,
    ) -> Person:
        person = Person(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            date_of_birth=data.date_of_birth,
            personal_email=str(data.personal_email) if data.personal_email else None,
            personal_phone=data.personal_phone,
            address=data.address,
        )
        self._session.add(person)
        if commit:
            await self._commit()
            await self._audit("person.created", person.id, actor_employment_id)
        else:
            await self._flush()
        return person

    async def create_person_response(
        self,
        data: PersonCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> PersonResponse:
        person = await self.create_person(data, actor_employment_id=actor_employment_id)
        return await self._person_response(person)

    async def get_person(self, person_id: int) -> PersonResponse:
        person = await self._require_person(person_id)
        return PersonResponse.model_validate(person)

    async def list_persons(
        self, *, limit: int = 100, offset: int = 0
    ) -> list[PersonResponse]:
        stmt = (
            select(Person)
            .where(Person.is_anonymized.is_(False))
            .order_by(Person.id.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = (await self._session.execute(stmt)).scalars().all()
        return [PersonResponse.model_validate(r) for r in rows]

    async def update_person(
        self,
        person_id: int,
        data: PersonUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> PersonResponse:
        person = await self._require_person(person_id)
        payload = data.model_dump(exclude_unset=True)
        if "personal_email" in payload and payload["personal_email"] is not None:
            payload["personal_email"] = str(payload["personal_email"])
        for field, value in payload.items():
            if field in ("first_name", "last_name") and isinstance(value, str):
                value = value.strip()
            setattr(person, field, value)
        await self._commit()
        await self._audit("person.updated", person.id, actor_employment_id)
        return await self._person_response(person)

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
        await self._session.refresh(pos)
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
        await self._session.refresh(pos)
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

    async def create_employee(
        self,
        data: EmployeeCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> EmploymentDetailResponse:
        """Create Person + Employment (+ optional assignment) in a single transaction."""
        person = await self.create_person(
            PersonCreate(
                first_name=data.first_name,
                last_name=data.last_name,
                date_of_birth=data.date_of_birth,
                personal_email=data.personal_email,
                personal_phone=data.personal_phone,
                address=data.address,
            ),
            actor_employment_id=actor_employment_id,
            commit=False,
        )
        return await self.create_employment(
            EmploymentCreate(
                person_id=person.id,
                employee_code=data.employee_code,
                employment_type=data.employment_type,
                joining_date=data.joining_date,
                initial_state=data.initial_state,
                initial_state_reason=data.initial_state_reason,
                department_id=_optional_id(data.department_id),
                position_id=_optional_id(data.position_id),
                location_id=_optional_id(data.location_id),
                shift_id=_optional_id(data.shift_id),
                work_mode=data.work_mode,
                assignment_change_reason=data.assignment_change_reason,
            ),
            actor_employment_id=actor_employment_id,
            person=person,
        )

    async def create_employment(
        self,
        data: EmploymentCreate,
        *,
        actor_employment_id: Optional[int] = None,
        person: Optional[Person] = None,
    ) -> EmploymentDetailResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID

        if person is None:
            person = await self._require_person(data.person_id)

        existing_code = await self._repo.get_employment_by_code(data.employee_code)
        if existing_code:
            raise ConflictError(f"Employee code '{data.employee_code}' already exists")

        emp = Employment(
            person_id=data.person_id,
            employee_code=data.employee_code,
            employment_type=data.employment_type,
            current_state=data.initial_state,
            joining_date=data.joining_date,
            changed_by=actor,
        )
        await self._repo.add(emp)
        await self._flush()

        history = EmploymentStateHistory(
            employment_id=emp.id,
            previous_state=None,
            new_state=data.initial_state,
            effective_date=data.joining_date,
            reason=data.initial_state_reason or "Initial employment",
            changed_by=actor,
        )
        await self._repo.add(history)

        current_assignment = None
        dept_id, pos_id, loc_id, shift_id = await self._validate_assignment_refs(
            department_id=data.department_id,
            position_id=data.position_id,
            location_id=data.location_id,
            shift_id=data.shift_id,
        )
        wants_assignment = any([dept_id, pos_id, loc_id, shift_id, data.work_mode])
        if wants_assignment:
            if data.work_mode is None:
                raise DomainError("work_mode is required when creating an assignment")
            if not data.assignment_change_reason:
                raise DomainError(
                    "assignment_change_reason is required when creating an assignment"
                )
            assignment = EmploymentAssignment(
                employment_id=emp.id,
                department_id=dept_id,
                position_id=pos_id,
                location_id=loc_id,
                shift_id=shift_id,
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

        await self._session.refresh(emp)
        if current_assignment is not None:
            await self._session.refresh(current_assignment)
        await self._session.refresh(history)
        await self._session.refresh(person)

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
            person=PersonResponse.model_validate(person),
        )

    async def get_employment(self, employment_id: int) -> EmploymentDetailResponse:
        emp = await self._repo.get_employment_by_id(employment_id, with_relations=True)
        if emp is None:
            raise NotFoundError("Employment not found")

        current_asg = await self._repo.get_current_assignment(employment_id)
        history = await self._repo.list_state_history(employment_id, limit=10)
        person = await self._session.get(Person, emp.person_id)

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
            person=PersonResponse.model_validate(person) if person else None,
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
        await self._session.refresh(emp)
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

        emp.current_state = data.new_state
        emp.changed_by = actor

        await self._commit()
        await self._audit("employment.state_changed", emp.id, actor_employment_id)
        await self._session.refresh(history)
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
        await self._audit(
            "employment.assignment_created", assignment.id, actor_employment_id
        )
        await self._session.refresh(assignment)
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
