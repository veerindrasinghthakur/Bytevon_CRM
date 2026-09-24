"""MyWorkAttendanceService — self-service attendance facade.

Delegates mutations (punch/break) to workforce AttendanceService;
owns today-info / week-hours / corrections list shapes for the my-work UI.
"""
from __future__ import annotations

from datetime import date, timedelta

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

    async def list_days_detailed(
        self,
        employment_id: int | None,
        *,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> list[AttendanceDayDetailResponse]:
        """History rows with punches for the my-work history table."""
        if employment_id is None:
            return []
        days = await self._wf.list_days(
            employment_id, from_date=from_date, to_date=to_date
        )
        out: list[AttendanceDayDetailResponse] = []
        for d in days:
            try:
                out.append(await self._wf.get_day(d.id))
            except Exception:
                continue
        return out

    async def today_info(self, employment_id: int | None) -> TodayInfoResponse:
        from sqlalchemy import select

        from app.modules.workforce.attendance.models import AttendanceBreak

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
        breaks = (
            await self._session.execute(
                select(AttendanceBreak).where(AttendanceBreak.attendance_day_id == day.id)
            )
        ).scalars().all()
        break_minutes = 0
        for b in breaks:
            if b.duration_minutes is not None:
                break_minutes += int(b.duration_minutes)
            elif b.break_end and b.break_start:
                end_ts = b.break_end.replace(tzinfo=None) if b.break_end.tzinfo else b.break_end
                start_ts = b.break_start.replace(tzinfo=None) if b.break_start.tzinfo else b.break_start
                break_minutes += max(0, int((end_ts - start_ts).total_seconds() // 60))
        return TodayInfoResponse(
            employmentId=employment_id,
            shift=str(day.shift_id) if day.shift_id else "—",
            status=status,
            checkIn=check_in,
            checkOut=check_out,
            workedMinutes=worked,
            breakMinutes=break_minutes,
            dayId=day.id,
        )

    async def week_hours(self, employment_id: int | None) -> WeekHoursResponse:
        from sqlalchemy import select

        from app.modules.workforce.attendance.models import AttendanceBreak

        if employment_id is None:
            return WeekHoursResponse()
        today = date.today()
        start = date.fromordinal(today.toordinal() - today.weekday())
        end = start + timedelta(days=6)
        days = await self._wf.list_days(employment_id, from_date=start, to_date=end)
        by_date = {d.attendance_date.isoformat(): d for d in days}
        day_ids = [d.id for d in days]
        breaks_by_day: dict[int, int] = {}
        if day_ids:
            res = await self._session.execute(
                select(AttendanceBreak).where(
                    AttendanceBreak.attendance_day_id.in_(day_ids)
                )
            )
            for b in res.scalars().all():
                mins = b.duration_minutes
                if mins is None and b.break_end and b.break_start:
                    end_ts = b.break_end.replace(tzinfo=None) if b.break_end.tzinfo else b.break_end
                    start_ts = b.break_start.replace(tzinfo=None) if b.break_start.tzinfo else b.break_start
                    mins = max(0, int((end_ts - start_ts).total_seconds() // 60))
                breaks_by_day[b.attendance_day_id] = breaks_by_day.get(b.attendance_day_id, 0) + int(mins or 0)
        out: list[WeekDayHours] = []
        total = 0
        for i in range(7):
            day = start + timedelta(days=i)
            key = day.isoformat()
            hit = by_date.get(key)
            if hit is None:
                status = "WEEK_OFF" if day.weekday() >= 5 else "NOT_MARKED"
                if day > today:
                    status = "UPCOMING"
                out.append(WeekDayHours(date=key, status=status, minutes=0, break_minutes=0))
                continue
            mins = int(float(hit.working_hours or 0) * 60)
            total += mins
            st = hit.status.value if hasattr(hit.status, "value") else str(hit.status)
            out.append(
                WeekDayHours(
                    date=key,
                    status=st,
                    minutes=mins,
                    break_minutes=breaks_by_day.get(hit.id, 0),
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
        # of the requester's current department). Falls back to administrators
        # / approval-grant holders so the directory is never empty when no
        # department head is assigned.
        import logging

        logger = logging.getLogger(__name__)
        if employment_id is None:
            return []
        try:
            from sqlalchemy import select

            from app.modules.auth.models import Person
            from app.modules.rbac.models.rbac_models import (
                EmployeeRole,
                Permission,
                Resource,
                Role,
                RolePermission,
            )
            from app.modules.workforce.department.models import Department
            from app.modules.workforce.employee.repository import EmployeeRepository
            from app.modules.workforce.models import Employment

            out: list[ApproverOption] = []
            seen: set[int] = set()

            async def _display_name(emp_id: int) -> str:
                try:
                    emp = await self._session.get(Employment, int(emp_id))
                    person = (
                        await self._session.get(Person, emp.person_id)
                        if emp is not None and getattr(emp, "person_id", None)
                        else None
                    )
                    if person is not None:
                        full = (
                            f"{getattr(person, 'first_name', '') or ''} "
                            f"{getattr(person, 'last_name', '') or ''}"
                        ).strip()
                        if full:
                            return full
                except Exception:
                    logger.exception("Approver name lookup failed for %s", emp_id)
                return f"Emp #{int(emp_id)}"

            async def _department_of(emp_id: int) -> int | None:
                try:
                    asg = await EmployeeRepository(self._session).get_current_assignment(
                        int(emp_id)
                    )
                    if asg is not None and asg.department_id is not None:
                        return int(asg.department_id)
                except Exception:
                    logger.exception("Approver department lookup failed for %s", emp_id)
                return None

            async def _push(emp_id: int, role_label: str) -> None:
                # The directory lists eligible approvers; the approvals engine
                # (not the directory) enforces who may act, so the requester
                # is listed too rather than leaving the select empty.
                eid = int(emp_id)
                if eid in seen:
                    return
                seen.add(eid)
                out.append(
                    ApproverOption(
                        employmentId=eid,
                        name=await _display_name(eid),
                        role=role_label,
                        departmentId=await _department_of(eid),
                    )
                )

            try:
                asg = await EmployeeRepository(self._session).get_current_assignment(
                    employment_id
                )
                if asg is not None and asg.department_id is not None:
                    dept = await self._session.get(Department, asg.department_id)
                    head_id = getattr(dept, "department_head_employment_id", None)
                    if head_id:
                        await _push(int(head_id), "Department Head")
            except Exception:
                logger.exception("Department-head approver lookup failed")

            if not out:
                try:
                    role_rows = (
                        await self._session.execute(
                            select(EmployeeRole.employment_id, Role.name).join(
                                Role, Role.id == EmployeeRole.role_id
                            )
                        )
                    ).all()
                    for eid, role_name in role_rows:
                        if role_name in ("Super Admin", "SuperAdmin"):
                            await _push(int(eid), "Administrator")
                    if not out:
                        approve_rows = (
                            await self._session.execute(
                                select(EmployeeRole.employment_id)
                                .join(Role, Role.id == EmployeeRole.role_id)
                                .join(
                                    RolePermission,
                                    RolePermission.role_id == Role.id,
                                )
                                .join(
                                    Permission,
                                    Permission.id == RolePermission.permission_id,
                                )
                                .join(Resource, Resource.id == Permission.resource_id)
                                .where(
                                    Resource.name == "approval",
                                    Permission.action == "APPROVE",
                                )
                            )
                        ).scalars().all()
                        for eid in approve_rows:
                            await _push(int(eid), "Approver")
                except Exception:
                    logger.exception("Fallback approver lookup failed")
            return out[:20]
        except Exception:
            return []


# Canonical name for my_work domain
AttendanceService = MyWorkAttendanceService
