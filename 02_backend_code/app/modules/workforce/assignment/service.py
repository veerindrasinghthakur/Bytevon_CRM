"""AssignmentService — assignments + employment state transitions."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import EmploymentState
from app.core.exceptions.exception import (
    ConflictError,
    DomainError,
    NotFoundError,
)
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.location.models import Location
from app.modules.workforce.shift.models import Shift
from app.modules.workforce.assignment.repository import AssignmentRepository
from app.modules.workforce.assignment.schemas import (
    EmploymentAssignmentCreate,
    EmploymentAssignmentResponse,
    EmploymentStateChangeRequest,
    EmploymentStateHistoryResponse,
)
from app.modules.workforce.department.models import Department
from app.modules.workforce.models import EmploymentAssignment, EmploymentStateHistory


def _optional_id(value: int | None) -> int | None:
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
            if await self._repo.get_position_by_id(position_id) is None:
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

    async def change_state(
        self,
        employment_id: int,
        data: EmploymentStateChangeRequest,
        *,
        actor_employment_id: int | None = None,
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
        cascade = data.new_state in {
            EmploymentState.RESIGNED,
            EmploymentState.TERMINATED,
            EmploymentState.ALUMNI,
        }
        notify_dept_head_id: int | None = None
        if cascade:
            # Q2 separation cascade. History rows are preserved; nothing is
            # hard-deleted. All steps share this transaction (single commit).
            notify_dept_head_id = await self._apply_separation_cascade(
                emp, separation_date=data.effective_date, actor=actor
            )
        await self._commit()
        await self._audit("employment.state_changed", emp.id, actor_employment_id)
        if cascade:
            await self._audit(
                "employment.separated", emp.id, actor_employment_id
            )
            await self._notify(
                employment_id=emp.id,
                title="Employment separated",
                body=(
                    f"Employment {emp.employee_code} moved to "
                    f"{data.new_state.value} effective {data.effective_date.isoformat()}. "
                    "Assignment closed; login deactivated; pending leave and "
                    "approvals cancelled."
                ),
            )
            if notify_dept_head_id is not None and notify_dept_head_id != emp.id:
                await self._notify(
                    employment_id=notify_dept_head_id,
                    title="Team member separated",
                    body=(
                        f"Employment {emp.employee_code} moved to "
                        f"{data.new_state.value} effective "
                        f"{data.effective_date.isoformat()}."
                    ),
                )
        await self._session.refresh(history)
        return EmploymentStateHistoryResponse.model_validate(history)

    async def _apply_separation_cascade(
        self,
        emp,
        *,
        separation_date,
        actor: int,
    ) -> int | None:
        """Close assignment, deactivate login, revoke sessions, cancel pending
        leave and requester-side pending approvals. Returns the department head
        employment id (for notification) when resolvable, else None."""
        from datetime import UTC, datetime

        from sqlalchemy import select

        from app.core.db.enums import (
            ApprovalActionType,
            ApprovalStatus,
            LeaveRequestStatus,
            SessionRevokeReason,
            SessionStatus,
        )
        from app.modules.approvals.models import ApprovalAction, ApprovalRequest
        from app.modules.auth.models import Login, Session
        from app.modules.leave.models import LeaveRequest
        from app.modules.workforce.department.models import Department

        dept_head_id: int | None = None

        # 1. Close the open assignment at the separation date; neutralize any
        # future-dated rows (effective_to < effective_from => never covering).
        assignments = list(await self._repo.list_assignments(emp.id))
        for asg in assignments:
            if asg.effective_from > separation_date:
                asg.effective_to = asg.effective_from - timedelta(days=1)
            elif asg.effective_to is None and asg.effective_from <= separation_date:
                close_to = separation_date
                asg.effective_to = (
                    close_to if close_to >= asg.effective_from else asg.effective_from
                )
            # Resolve department head before closing for notification.
            if (
                dept_head_id is None
                and asg.department_id is not None
            ):
                dept = await self._session.get(Department, asg.department_id)
                head = getattr(dept, "department_head_employment_id", None)
                if head:
                    dept_head_id = int(head)

        # 2. Deactivate the associated login (linked via person) + revoke sessions.
        login = await self._session.scalar(
            select(Login).where(Login.person_id == emp.person_id)
        )
        if login is not None:
            login.is_active = False
            sessions = list(
                await self._session.scalars(
                    select(Session).where(
                        Session.login_id == login.id,
                        Session.status == SessionStatus.ACTIVE,
                    )
                )
            )
            for s in sessions:
                s.status = SessionStatus.REVOKED
                s.revoked_reason = SessionRevokeReason.ACCOUNT_DISABLED
                s.revoked_at = datetime.now(UTC)

        # 3. Cancel pending leave belonging to the employee (history preserved).
        pending_leave = list(
            await self._session.scalars(
                select(LeaveRequest).where(
                    LeaveRequest.employment_id == emp.id,
                    LeaveRequest.status == LeaveRequestStatus.PENDING,
                )
            )
        )
        for lr in pending_leave:
            lr.status = LeaveRequestStatus.CANCELLED
        # 4. Cancel requester-side pending approvals of any type (history kept).
        pending_approvals = list(
            await self._session.scalars(
                select(ApprovalRequest).where(
                    ApprovalRequest.requester_employment_id == emp.id,
                    ApprovalRequest.status == ApprovalStatus.PENDING,
                )
            )
        )
        for ap in pending_approvals:
            ap.status = ApprovalStatus.CANCELLED
            self._session.add(
                ApprovalAction(
                    approval_request_id=ap.id,
                    employment_id=actor,
                    action=ApprovalActionType.COMMENTED,
                    remarks="Cancelled due to employment separation",
                )
            )
            # Keep the leave projection consistent when the approval belongs
            # to a leave request handled in another session.
            if ap.request_type == "LEAVE_REQUEST":
                linked = await self._session.scalar(
                    select(LeaveRequest).where(
                        LeaveRequest.approval_request_id == ap.id,
                        LeaveRequest.status == LeaveRequestStatus.PENDING,
                    )
                )
                if linked is not None:
                    linked.status = LeaveRequestStatus.CANCELLED
        return dept_head_id

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
        actor_employment_id: int | None = None,
    ) -> EmploymentAssignmentResponse:
        emp = await self._repo.get_employment_by_id(employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")
        # Q1/Q2: separated employments cannot receive new assignments.
        if emp.current_state in {
            EmploymentState.RESIGNED,
            EmploymentState.TERMINATED,
            EmploymentState.ALUMNI,
        }:
            raise DomainError(
                "Cannot create an assignment for a separated employment "
                f"({emp.current_state.value})"
            )
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        dept_id, pos_id, loc_id, shift_id = await self._validate_assignment_refs(
            department_id=data.department_id,
            position_id=data.position_id,
            location_id=data.location_id,
            shift_id=data.shift_id,
        )
        # Q1 canonical temporal model: a new row covers [effective_from, +inf).
        # Any existing covering row (other than the single predecessor we close)
        # is a conflict — including backdated inserts that would overlap history
        # and future-dated rows the new row would swallow. Return 409.
        covering = list(
            await self._repo.list_covering_assignments(
                employment_id, data.effective_from
            )
        )
        current = await self._repo.get_current_assignment(
            employment_id, as_of=data.effective_from
        )
        predecessors = {current.id} if current is not None else set()
        conflicts = [r for r in covering if r.id not in predecessors]
        if conflicts:
            raise ConflictError(
                "New assignment overlaps existing assignment history "
                f"(effective_from={data.effective_from.isoformat()})"
            )
        if await self._repo.has_future_assignments(
            employment_id, as_of=data.effective_from
        ):
            raise ConflictError(
                "New assignment would overlap a future-dated assignment "
                f"(effective_from={data.effective_from.isoformat()})"
            )
        if current and current.effective_to is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_assignment(current.id, close_to)
            else:
                # Backdated to/past the predecessor start: predecessor collapses
                # to a zero-length [from, from] row so periods never overlap.
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
        self, employment_id: int, *, as_of: date | None = None
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
