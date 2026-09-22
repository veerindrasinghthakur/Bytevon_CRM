"""MyWorkAttendanceService — self-service attendance facade.

Delegates mutations (punch/break) to workforce AttendanceService;
owns today-info / week-hours / corrections list shapes for the my-work UI.
"""
from __future__ import annotations

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import PunchType
from app.modules.my_work.attendance.repository import MyWorkAttendanceRepository
from app.modules.my_work.attendance.schemas import (
    ApproverOption,
    CorrectionCandidate,
    CorrectionListItem,
    CorrectionListResponse,
    TodayInfoResponse,
    WeekDayHours,
    WeekHoursResponse,
)
from app.modules.workforce.attendance.schemas import (
    AttendanceDayDetailResponse,
    AttendanceDayResponse,
    BreakEndRequest,
    BreakResponse,
    BreakStartRequest,
    PunchRequest,
    PunchResponse,
)
from app.modules.workforce.attendance.service import AttendanceService as WorkforceAttendanceService


class MyWorkAttendanceService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = MyWorkAttendanceRepository(session)
        self._wf = WorkforceAttendanceService(session)

    async def punch(
        self,
        body: PunchRequest,
        *,
        client_ip: str,
        employment_id: int | None = None,
    ) -> PunchResponse:
        if employment_id is not None:
            body = body.model_copy(update={"employment_id": employment_id})
        return await self._wf.punch(
            body, client_ip=client_ip, actor_employment_id=employment_id
        )

    async def start_break(
        self, body: BreakStartRequest, *, employment_id: int | None = None
    ) -> BreakResponse:
        return await self._wf.start_break(body, actor_employment_id=employment_id)

    async def end_break(
        self,
        break_id: int,
        body: BreakEndRequest,
        *,
        employment_id: int | None = None,
    ) -> BreakResponse:
        return await self._wf.end_break(
            break_id, body, actor_employment_id=employment_id
        )

    async def list_days(
        self,
        employment_id: int | None,
        *,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> list[AttendanceDayResponse]:
        if employment_id is None:
            return []
        return await self._wf.list_days(
            employment_id, from_date=from_date, to_date=to_date
        )

    async def today_info(self, employment_id: int | None) -> TodayInfoResponse:
        if employment_id is None:
            return TodayInfoResponse()
        today = date.today()
        days = await self._wf.list_days(employment_id, from_date=today, to_date=today)
        if not days:
            return TodayInfoResponse(
                employmentId=employment_id,
                status="NOT_STARTED",
            )
        day = days[0]
        detail: AttendanceDayDetailResponse = await self._wf.get_day(day.id)
        check_in = None
        check_out = None
        for p in detail.punches:
            if p.punch_type == PunchType.CHECK_IN and check_in is None:
                check_in = p.punch_time.isoformat()
            if p.punch_type == PunchType.CHECK_OUT:
                check_out = p.punch_time.isoformat()
        worked = int(float(day.working_hours or 0) * 60)
        status = day.status.value if hasattr(day.status, "value") else str(day.status)
        return TodayInfoResponse(
            employmentId=employment_id,
            shift=str(day.shift_id) if day.shift_id else "—",
            status=status,
            checkIn=check_in,
            checkOut=check_out,
            workedMinutes=worked,
            breakMinutes=0,
            dayId=day.id,
        )

    async def week_hours(self, employment_id: int | None) -> WeekHoursResponse:
        if employment_id is None:
            return WeekHoursResponse()
        today = date.today()
        start = date.fromordinal(today.toordinal() - today.weekday())
        days = await self._wf.list_days(employment_id, from_date=start, to_date=today)
        out: list[WeekDayHours] = []
        total = 0
        for d in days:
            mins = int(float(d.working_hours or 0) * 60)
            total += mins
            st = d.status.value if hasattr(d.status, "value") else str(d.status)
            out.append(
                WeekDayHours(
                    date=d.attendance_date.isoformat(),
                    status=st,
                    minutes=mins,
                )
            )
        return WeekHoursResponse(
            employmentId=employment_id,
            days=out,
            totalMinutes=total,
        )

    async def list_corrections(
        self,
        employment_id: int | None,
        *,
        page: int = 1,
        page_size: int = 20,
    ) -> CorrectionListResponse:
        # Q14: real domain data (no stub).
        if employment_id is None:
            return CorrectionListResponse(page=page, pageSize=page_size)
        rows = await self._wf.list_corrections_by_employment(
            employment_id, limit=page * page_size
        )
        items = [
            CorrectionListItem(
                id=r.id,
                attendanceDayId=r.attendance_day_id,
                status=r.status.value if hasattr(r.status, "value") else str(r.status),
                reason=r.reason or "",
                createdAt=r.created_at,
            )
            for r in rows
        ]
        total = len(items)
        start = (max(1, page) - 1) * max(1, page_size)
        return CorrectionListResponse(
            items=items[start : start + max(1, page_size)],
            total=total,
            page=page,
            pageSize=page_size,
        )

    async def correction_candidates(
        self, employment_id: int | None
    ) -> list[CorrectionCandidate]:
        # Q14: recent attendance days are the correctable candidates.
        if employment_id is None:
            return []
        today = date.today()
        start = date.fromordinal(max(1, today.toordinal() - 30))
        days = await self._wf.list_days(employment_id, from_date=start, to_date=today)
        out: list[CorrectionCandidate] = []
        for d in days:
            st = d.status.value if hasattr(d.status, "value") else str(d.status)
            out.append(
                CorrectionCandidate(
                    attendanceDayId=d.id,
                    date=d.attendance_date,
                    status=st,
                    label=f"{d.attendance_date.isoformat()} — {st}",
                )
            )
        return out

    async def list_approvers(
        self, employment_id: int | None
    ) -> list[ApproverOption]:
        # Q10: approver resolved from the manager hierarchy (department head
        # of the requester's current department).
        if employment_id is None:
            return []
        try:
            from app.modules.workforce.department.models import Department
            from app.modules.workforce.employee.repository import EmployeeRepository

            asg = await EmployeeRepository(self._session).get_current_assignment(
                employment_id
            )
            if asg is None or asg.department_id is None:
                return []
            dept = await self._session.get(Department, asg.department_id)
            head_id = getattr(dept, "department_head_employment_id", None)
            if not head_id:
                return []
            return [
                ApproverOption(
                    employmentId=int(head_id),
                    name=f"Emp #{int(head_id)}",
                    role="Department Head",
                )
            ]
        except Exception:
            return []


# Canonical name for my_work domain
AttendanceService = MyWorkAttendanceService
