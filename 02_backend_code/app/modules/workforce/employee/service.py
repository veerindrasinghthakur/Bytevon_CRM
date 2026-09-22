"""EmployeeService — persons, positions, employments."""
from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import EmploymentState, WorkMode
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.location.models import Location
from app.modules.admin.shift.models import Shift
from app.modules.auth.models import Person
from app.modules.workforce.department.models import Department
from app.modules.workforce.employee.repository import EmployeeRepository
from app.modules.workforce.employee.schemas import (
    EmployeeCreate,
    EmploymentAssignmentResponse,
    EmploymentCreate,
    EmploymentDetailResponse,
    EmploymentResponse,
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
from app.modules.workforce.models import (
    Employment,
    EmploymentAssignment,
    EmploymentStateHistory,
    Position,
)

logger = logging.getLogger(__name__)


def _optional_id(value: int | None) -> int | None:
    if value is None or value <= 0:
        return None
    return value


class EmployeeService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = EmployeeRepository(session)

    async def _require_person(self, person_id: int) -> Person:
        person = await self._session.get(Person, person_id)
        if person is None:
            raise NotFoundError(f"Person not found (id={person_id})")
        return person

    async def _person_response(self, person: Person) -> PersonResponse:
        await self._session.refresh(person)
        return PersonResponse.model_validate(person)

    async def _next_employee_code(self) -> str:
        count = await self._session.scalar(select(func.count()).select_from(Employment))
        n = int(count or 0) + 1
        while True:
            code = f"EMP-{n:04d}"
            existing = await self._repo.get_employment_by_code(code)
            if existing is None:
                return code
            n += 1

    async def _validate_assignment_refs(
        self,
        *,
        department_id: int | None,
        position_id: int | None,
        location_id: int | None,
        shift_id: int | None,
    ) -> tuple[int | None, int | None, int | None, int | None]:
        department_id = _optional_id(department_id)
        position_id = _optional_id(position_id)
        location_id = _optional_id(location_id)
        shift_id = _optional_id(shift_id)

        if department_id is not None:
            dept = await self._session.get(Department, department_id)
            if dept is None or bool(getattr(dept, "is_archived", False)):
                raise NotFoundError(f"Department not found (id={department_id})")
        if position_id is not None:
            pos = await self._repo.get_position_by_id(position_id)
            if pos is None:
                raise NotFoundError(f"Position not found (id={position_id})")
        if location_id is not None:
            loc = await self._session.get(Location, location_id)
            if loc is None or bool(getattr(loc, "is_archived", False)):
                raise NotFoundError(f"Location not found (id={location_id})")
        if shift_id is not None:
            shift = await self._session.get(Shift, shift_id)
            if shift is None or bool(getattr(shift, "is_archived", False)):
                raise NotFoundError(f"Shift not found (id={shift_id})")
        return department_id, position_id, location_id, shift_id

    # Persons
    async def create_person(
        self, data: PersonCreate, *, actor_employment_id: int | None = None, commit: bool = True
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
        self, data: PersonCreate, *, actor_employment_id: int | None = None
    ) -> PersonResponse:
        person = await self.create_person(data, actor_employment_id=actor_employment_id)
        return await self._person_response(person)

    async def get_person(self, person_id: int) -> PersonResponse:
        return PersonResponse.model_validate(await self._require_person(person_id))

    async def list_persons(self, *, limit: int = 100, offset: int = 0) -> list[PersonResponse]:
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
        self, person_id: int, data: PersonUpdate, *, actor_employment_id: int | None = None
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

    # Positions
    async def create_position(
        self, data: PositionCreate, *, actor_employment_id: int | None = None
    ) -> PositionResponse:
        if await self._repo.get_position_by_name(data.name):
            raise ConflictError(f"Position '{data.name}' already exists")
        pos = Position(name=data.name)
        await self._repo.add(pos)
        await self._commit()
        await self._audit("position.created", pos.id, actor_employment_id)
        await self._session.refresh(pos)
        return PositionResponse.model_validate(pos)

    async def get_position(
        self, position_id: int, *, include_archived: bool = False
    ) -> PositionResponse:
        """Q15: archived hidden by default; history views opt in."""
        pos = await self._repo.get_position_by_id(
            position_id, include_archived=True
        )
        if pos is None:
            raise NotFoundError("Position not found")
        if bool(getattr(pos, "is_archived", False)) and not include_archived:
            raise NotFoundError("Position not found")
        return PositionResponse.model_validate(pos)

    async def list_positions(self, *, include_archived: bool = False) -> list[PositionResponse]:
        rows = await self._repo.list_positions(include_archived=include_archived)
        return [PositionResponse.model_validate(r) for r in rows]

    async def update_position(
        self, position_id: int, data: PositionUpdate, *, actor_employment_id: int | None = None
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
        self, position_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        return await self.delete_position(position_id, actor_employment_id=actor_employment_id)

    async def _count_active_assignments_for_position(self, position_id: int) -> int:
        """Active (covering today) assignments referencing this position."""
        from datetime import date as _date

        from sqlalchemy import func, select

        from app.modules.workforce.models import EmploymentAssignment

        today = _date.today()
        stmt = select(func.count(EmploymentAssignment.id)).where(
            EmploymentAssignment.position_id == position_id,
            EmploymentAssignment.effective_from <= today,
            (EmploymentAssignment.effective_to.is_(None))
            | (EmploymentAssignment.effective_to >= today),
        )
        res = await self._session.execute(stmt)
        return int(res.scalar() or 0)

    async def delete_position(
        self, position_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        pos = await self._repo.get_position_by_id(position_id)
        if pos is None or bool(getattr(pos, "is_archived", False)):
            raise NotFoundError("Position not found")
        # Q3: cannot archive while actively referenced; reassign first.
        active = await self._count_active_assignments_for_position(position_id)
        if active > 0:
            raise ConflictError(
                f"Position is still referenced by {active} active assignment(s); "
                "reassign those employments first"
            )
        pos.is_archived = True
        pos.archived_at = datetime.now(UTC)
        pos.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("position.deleted", pos.id, actor_employment_id)
        return MessageResponse(message="Position deleted")

    async def restore_position(
        self, position_id: int, *, actor_employment_id: int | None = None
    ) -> PositionResponse:
        """Q16: restore an archived position (409 on active name clash)."""
        pos = await self._repo.get_position_by_id(position_id, include_archived=True)
        if pos is None:
            raise NotFoundError("Position not found")
        if not bool(getattr(pos, "is_archived", False)):
            raise DomainError("Position is not archived")
        clash = await self._repo.get_position_by_name(pos.name)
        if clash is not None and clash.id != position_id:
            raise ConflictError(
                f"Cannot restore: position '{pos.name}' already exists"
            )
        pos.is_archived = False
        pos.archived_at = None
        pos.archived_by = None
        await self._commit()
        await self._audit("position.restored", pos.id, actor_employment_id)
        await self._session.refresh(pos)
        return PositionResponse.model_validate(pos)

    # Employments
    async def create_employee(
        self, data: EmployeeCreate, *, actor_employment_id: int | None = None
    ) -> EmploymentDetailResponse:
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
        code = (data.employee_code or "").strip() or await self._next_employee_code()
        dept_id = _optional_id(data.department_id)
        pos_id = _optional_id(data.position_id)
        loc_id = _optional_id(data.location_id)
        shift_id = _optional_id(data.shift_id)
        wants_assignment = any([dept_id, pos_id, loc_id, shift_id, data.work_mode])
        work_mode = data.work_mode
        reason = data.assignment_change_reason
        if wants_assignment:
            if work_mode is None:
                work_mode = WorkMode.OFFICE
            if not reason:
                reason = "Initial assignment"
        return await self.create_employment(
            EmploymentCreate(
                person_id=person.id,
                employee_code=code,
                employment_type=data.employment_type,
                joining_date=data.joining_date,
                initial_state=data.initial_state,
                initial_state_reason=data.initial_state_reason,
                department_id=dept_id,
                position_id=pos_id,
                location_id=loc_id,
                shift_id=shift_id,
                work_mode=work_mode,
                assignment_change_reason=reason,
                create_login=data.create_login,
                login_email=data.login_email,
                login_temporary_password=data.login_temporary_password,
                login_role_id=data.login_role_id,
            ),
            actor_employment_id=actor_employment_id,
            person=person,
        )

    async def rehire_employment(
        self, employment_id: int, data, *, actor_employment_id: int | None = None
    ) -> EmploymentDetailResponse:
        """Q7: rehire = new Employment row for the SAME Person.

        The old (separated) row is never revived or modified. The person's
        existing login is reactivated when present.
        """
        old = await self._repo.get_employment_by_id(employment_id)
        if old is None:
            raise NotFoundError("Employment not found")
        if old.current_state not in {
            EmploymentState.RESIGNED,
            EmploymentState.TERMINATED,
            EmploymentState.ALUMNI,
        }:
            raise DomainError(
                "Only a separated employment "
                f"(RESIGNED/TERMINATED/ALUMNI) can be rehired; "
                f"current state is {old.current_state.value}"
            )
        person = await self._require_person(old.person_id)
        detail = await self.create_employment(
            EmploymentCreate(
                person_id=person.id,
                employee_code=data.employee_code,
                employment_type=data.employment_type,
                joining_date=data.joining_date,
                initial_state=data.initial_state,
                initial_state_reason=data.initial_state_reason
                or f"Rehire from employment {old.employee_code}",
                department_id=data.department_id,
                position_id=data.position_id,
                location_id=data.location_id,
                shift_id=data.shift_id,
                work_mode=data.work_mode,
                assignment_change_reason=data.assignment_change_reason
                or "Rehire",
                create_login=data.create_login,
                login_email=data.login_email,
                login_temporary_password=data.login_temporary_password,
                login_role_id=data.login_role_id,
            ),
            actor_employment_id=actor_employment_id,
            person=person,
        )
        if data.reactivate_login and not data.create_login:
            await self._provision_login_for_employment(
                employment_id=detail.id,
                person_id=person.id,
                email=None,
                temporary_password=data.login_temporary_password,
                role_id=data.login_role_id,
                actor_employment_id=actor_employment_id,
                reactivate_only=True,
            )
            await self._commit()
        await self._audit("employment.rehired", detail.id, actor_employment_id)
        await self._notify(
            employment_id=detail.id,
            title="Employment rehired",
            body=(
                f"New employment {detail.employee_code} created for rehired "
                f"person (previous {old.employee_code})."
            ),
        )
        return detail

    async def _require_no_active_employment(self, person_id: int) -> None:
        """Q7: a Person cannot accidentally hold multiple simultaneous active
        employments. Active = any non-terminal state."""
        terminal = {
            EmploymentState.RESIGNED,
            EmploymentState.TERMINATED,
            EmploymentState.ALUMNI,
        }
        for emp in await self._repo.list_employments_by_person(person_id):
            if emp.current_state not in terminal:
                raise ConflictError(
                    "Person already has an active employment "
                    f"({emp.employee_code} in state {emp.current_state.value}); "
                    "separate it before creating another"
                )

    async def _provision_login_for_employment(
        self,
        *,
        employment_id: int,
        person_id: int,
        email: str | None,
        temporary_password: str | None,
        role_id: int | str | None,
        actor_employment_id: int | None,
        reactivate_only: bool = False,
    ) -> None:
        """Q9 explicit login provisioning / Q7 login reactivation.

        One login per person: an existing login is reactivated (is_active=True,
        lock cleared, archived flag lifted); otherwise a new login is created
        when email + password are supplied. `reactivate_only` never creates.
        """
        from sqlalchemy import select

        from app.core.security.password_manager import PasswordManager
        from app.modules.auth.models import Login
        from app.modules.rbac.models import EmployeeRole, Role

        existing = (
            await self._session.execute(
                select(Login).where(Login.person_id == person_id)
            )
        ).scalar_one_or_none()
        if existing is not None:
            if bool(getattr(existing, "is_archived", False)):
                existing.is_archived = False
                existing.archived_at = None
                existing.archived_by = None
            existing.is_active = True
            existing.failed_attempt_count = 0
            existing.locked_until = None
            if temporary_password:
                existing.password_hash = PasswordManager().hash(temporary_password)
            if role_id is not None:
                role = None
                if isinstance(role_id, int) or (
                    isinstance(role_id, str) and role_id.isdigit()
                ):
                    role = await self._session.get(Role, int(role_id))
                else:
                    role = (
                        await self._session.execute(
                            select(Role).where(Role.name == role_id)
                        )
                    ).scalar_one_or_none()
                if role is None:
                    raise NotFoundError(f"Role '{role_id}' not found")
                grant = (
                    await self._session.execute(
                        select(EmployeeRole).where(
                            EmployeeRole.employment_id == employment_id,
                            EmployeeRole.role_id == role.id,
                        )
                    )
                ).scalar_one_or_none()
                if grant is None:
                    self._session.add(
                        EmployeeRole(
                            employment_id=employment_id,
                            role_id=role.id,
                            changed_by=actor_employment_id,
                        )
                    )
            await self._flush()
            await self._audit("login.reactivated", existing.id, actor_employment_id)
            return
        if reactivate_only:
            return
        if not email or not temporary_password:
            raise DomainError(
                "create_login requires login_email and login_temporary_password"
            )
        clash = (
            await self._session.execute(select(Login).where(Login.email == email))
        ).scalar_one_or_none()
        if clash is not None:
            raise ConflictError(f"Login email '{email}' already exists")
        login = Login(
            person_id=person_id,
            email=email,
            password_hash=PasswordManager().hash(temporary_password),
            is_active=True,
            failed_attempt_count=0,
        )
        self._session.add(login)
        await self._flush()
        if role_id is not None:
            role = None
            if isinstance(role_id, int) or (
                isinstance(role_id, str) and role_id.isdigit()
            ):
                role = await self._session.get(Role, int(role_id))
            else:
                role = (
                    await self._session.execute(
                        select(Role).where(Role.name == role_id)
                    )
                ).scalar_one_or_none()
            if role is None:
                raise NotFoundError(f"Role '{role_id}' not found")
            self._session.add(
                EmployeeRole(
                    employment_id=employment_id,
                    role_id=role.id,
                    changed_by=actor_employment_id,
                )
            )
        await self._audit("login.created", login.id, actor_employment_id)

    async def create_employment(
        self,
        data: EmploymentCreate,
        *,
        actor_employment_id: int | None = None,
        person: Person | None = None,
    ) -> EmploymentDetailResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        if person is None:
            person = await self._require_person(data.person_id)
        # Q7: guard against multiple simultaneous active employments.
        await self._require_no_active_employment(person.id)
        if await self._repo.get_employment_by_code(data.employee_code):
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
            assignment = EmploymentAssignment(
                employment_id=emp.id,
                department_id=dept_id,
                position_id=pos_id,
                location_id=loc_id,
                shift_id=shift_id,
                work_mode=data.work_mode or WorkMode.OFFICE,
                effective_from=data.joining_date,
                effective_to=None,
                change_reason=data.assignment_change_reason or "Initial assignment",
                changed_by=actor,
            )
            await self._repo.add(assignment)
            current_assignment = assignment
        # Q9: explicit opt-in login provisioning (default off).
        if data.create_login:
            await self._provision_login_for_employment(
                employment_id=emp.id,
                person_id=person.id,
                email=str(data.login_email) if data.login_email else None,
                temporary_password=data.login_temporary_password,
                role_id=data.login_role_id,
                actor_employment_id=actor_employment_id,
            )
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
            recent_state_history=[EmploymentStateHistoryResponse.model_validate(history)],
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
                EmploymentAssignmentResponse.model_validate(current_asg) if current_asg else None
            ),
            recent_state_history=[
                EmploymentStateHistoryResponse.model_validate(h) for h in history
            ],
            person=PersonResponse.model_validate(person) if person else None,
        )

    async def list_employments(
        self, *, state: EmploymentState | None = None, limit: int = 100, offset: int = 0
    ) -> list[EmploymentResponse]:
        rows = await self._repo.list_employments(
            state=state.value if state else None, limit=limit, offset=offset
        )
        return [EmploymentResponse.model_validate(r) for r in rows]

    async def list_employments_by_person(self, person_id: int) -> list[EmploymentResponse]:
        rows = await self._repo.list_employments_by_person(person_id)
        return [EmploymentResponse.model_validate(r) for r in rows]

    async def update_employment(
        self, employment_id: int, data: EmploymentUpdate, *, actor_employment_id: int | None = None
    ) -> EmploymentResponse:
        emp = await self._repo.get_employment_by_id(employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")
        if data.employee_code is not None and data.employee_code != emp.employee_code:
            if await self._repo.get_employment_by_code(data.employee_code):
                raise ConflictError(f"Employee code '{data.employee_code}' already exists")
            emp.employee_code = data.employee_code
        if data.employment_type is not None:
            emp.employment_type = data.employment_type
        emp.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("employment.updated", emp.id, actor_employment_id)
        await self._session.refresh(emp)
        return EmploymentResponse.model_validate(emp)


# Back-compat
EmploymentPublicService = EmployeeService
EmploymentService = EmployeeService
