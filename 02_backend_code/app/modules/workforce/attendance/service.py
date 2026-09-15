"""AttendanceService — workforce operational attendance + policy helpers."""
from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import (
    ApprovalStatus,
    ApprovalTarget,
    AttendanceCorrectionStatus,
    AttendanceStatus,
    PunchType,
)
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.approvals.schemas.schemas import ApprovalRequestCreate
from app.modules.approvals.services.public_service import ApprovalPublicService
from app.modules.workforce.attendance.models import (
    AttendanceBreak,
    AttendanceCorrection,
    AttendanceDay,
    AttendancePolicy,
    AttendancePunch,
    MonthlyAttendanceSummary,
)
from app.modules.workforce.attendance.repository import AttendanceRepository
from app.modules.workforce.attendance.schemas import (
    AttendanceDayDetailResponse,
    AttendanceDayResponse,
    AttendancePolicyCreate,
    AttendancePolicyResponse,
    BreakEndRequest,
    BreakResponse,
    BreakStartRequest,
    CorrectionCreate,
    CorrectionResponse,
    MonthlySummaryResponse,
    PunchRequest,
    PunchResponse,
)

logger = logging.getLogger(__name__)
ATTENDANCE_CORRECTION_TYPE = "ATTENDANCE_CORRECTION"


def _compute_working_hours(punches: list) -> Optional[Decimal]:
    total_seconds = 0.0
    last_in = None
    for p in sorted(punches, key=lambda x: x.punch_time):
        if not p.is_valid_punch:
            continue
        if p.punch_type == PunchType.CHECK_IN:
            last_in = p.punch_time
        elif p.punch_type == PunchType.CHECK_OUT and last_in is not None:
            delta = (p.punch_time - last_in).total_seconds()
            if delta > 0:
                total_seconds += delta
            last_in = None
    if total_seconds <= 0:
        return None
    return Decimal(str(round(total_seconds / 3600.0, 2)))


class AttendanceService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = AttendanceRepository(session)
        self._approvals = ApprovalPublicService(session)

    async def punch(self, data: PunchRequest, *, client_ip: str, actor_employment_id: Optional[int] = None) -> PunchResponse:
        now = datetime.now(timezone.utc)
        punch_time = data.punch_time or now
        if punch_time.tzinfo is None:
            punch_time = punch_time.replace(tzinfo=timezone.utc)
        att_date = data.attendance_date or punch_time.date()
        policy = await self._repo.get_current_policy(as_of=att_date)
        day = await self._repo.get_day_by_employment_date(data.employment_id, att_date)
        if day is None:
            if policy and not policy.auto_create_attendance_day:
                raise DomainError("No attendance day exists and auto-create is disabled")
            day = AttendanceDay(employment_id=data.employment_id, shift_id=data.shift_id, attendance_date=att_date, status=AttendanceStatus.PRESENT)
            await self._repo.add(day)
            await self._flush()
        elif data.shift_id and day.shift_id is None:
            day.shift_id = data.shift_id
        if policy and policy.require_checkout_before_new_checkin:
            last = await self._repo.get_last_punch(day.id)
            if last and last.punch_type == PunchType.CHECK_IN and data.punch_type == PunchType.CHECK_IN:
                raise DomainError("Check-out required before a new check-in")
        if policy and not policy.allow_multiple_punches:
            existing = await self._repo.list_punches(day.id)
            if any(p.punch_type == data.punch_type for p in existing):
                raise ConflictError(f"Multiple {data.punch_type.value} punches are not allowed by policy")
        is_valid = bool(client_ip)
        punch = AttendancePunch(attendance_day_id=day.id, punch_type=data.punch_type, punch_time=punch_time, latitude=data.latitude, longitude=data.longitude, accuracy_meters=data.accuracy_meters, client_ip=client_ip or "0.0.0.0", is_valid_punch=is_valid, validation_message=None if is_valid else "Missing client IP")
        await self._repo.add(punch)
        await self._flush()
        punches = list(await self._repo.list_punches(day.id))
        punches.append(punch)
        day.working_hours = _compute_working_hours(punches)
        if day.status not in (AttendanceStatus.HOLIDAY, AttendanceStatus.WEEK_OFF, AttendanceStatus.ON_LEAVE):
            day.status = AttendanceStatus.PRESENT
        await self._commit()
        await self._audit("attendance.punch", punch.id, actor_employment_id)
        return PunchResponse.model_validate(punch)

    async def get_day(self, day_id: int) -> AttendanceDayDetailResponse:
        day = await self._repo.get_day_by_id(day_id, with_punches=True)
        if day is None:
            raise NotFoundError("Attendance day not found")
        return AttendanceDayDetailResponse(**AttendanceDayResponse.model_validate(day).model_dump(), punches=[PunchResponse.model_validate(p) for p in day.punches])

    async def list_days(self, employment_id: int, *, from_date: Optional[date] = None, to_date: Optional[date] = None) -> list[AttendanceDayResponse]:
        rows = await self._repo.list_days(employment_id, from_date=from_date, to_date=to_date)
        return [AttendanceDayResponse.model_validate(r) for r in rows]

    async def submit_correction(self, data: CorrectionCreate, *, actor_employment_id: int) -> CorrectionResponse:
        day = await self._repo.get_day_by_id(data.attendance_day_id)
        if day is None:
            raise NotFoundError("Attendance day not found")
        policy = await self._repo.get_current_policy(as_of=day.attendance_date)
        if policy:
            if (date.today() - day.attendance_date).days > policy.correction_window_days:
                raise DomainError(f"Correction window exceeded ({policy.correction_window_days} days)")
            if policy.reasons_mandatory and not data.reason.strip():
                raise DomainError("Correction reason is mandatory")
            if policy.max_corrections_per_month is not None:
                count = await self._repo.count_corrections_in_month(day.employment_id, day.attendance_date.year, day.attendance_date.month)
                if count >= policy.max_corrections_per_month:
                    raise DomainError("Max corrections per month reached")
        summary = await self._repo.get_monthly_summary(day.employment_id, day.attendance_date.year, day.attendance_date.month)
        if summary and summary.is_locked:
            raise DomainError("Attendance month is locked (payroll paid)")
        correction = AttendanceCorrection(attendance_day_id=day.id, requested_check_in=data.requested_check_in, requested_check_out=data.requested_check_out, reason=data.reason, status=AttendanceCorrectionStatus.PENDING)
        await self._repo.add(correction)
        await self._flush()
        approval = await self._approvals.create_request(ApprovalRequestCreate(request_type=ATTENDANCE_CORRECTION_TYPE, reference_id=correction.id, requester_employment_id=actor_employment_id, target=ApprovalTarget.DEPARTMENT_HEAD, target_department_id=data.target_department_id), actor_employment_id=actor_employment_id, commit=False)
        correction.approval_request_id = approval.id
        await self._commit()
        await self._audit("attendance_correction.submitted", correction.id, actor_employment_id)
        return CorrectionResponse.model_validate(correction)

    async def get_correction(self, correction_id: int) -> CorrectionResponse:
        c = await self._repo.get_correction_by_id(correction_id)
        if c is None:
            raise NotFoundError("Attendance correction not found")
        return CorrectionResponse.model_validate(c)

    async def handle_approval_decision(self, event: dict) -> None:
        if event.get("request_type") != ATTENDANCE_CORRECTION_TYPE:
            return
        status_str = event.get("status")
        reference_id = event.get("reference_id")
        actor = event.get("actor_employment_id") or settings.SYSTEM_EMPLOYMENT_ID
        correction = await self._repo.get_correction_by_id(int(reference_id))
        if correction is None:
            logger.warning("Attendance correction %s not found for approval event", reference_id)
            return
        if status_str == ApprovalStatus.APPROVED.value:
            if correction.status == AttendanceCorrectionStatus.APPROVED:
                return
            correction.status = AttendanceCorrectionStatus.APPROVED
            day = await self._repo.get_day_by_id(correction.attendance_day_id, with_punches=True)
            if day:
                if correction.requested_check_in:
                    await self._repo.add(AttendancePunch(attendance_day_id=day.id, punch_type=PunchType.CHECK_IN, punch_time=correction.requested_check_in, client_ip="0.0.0.0", is_valid_punch=True, validation_message="Applied via approved correction"))
                if correction.requested_check_out:
                    await self._repo.add(AttendancePunch(attendance_day_id=day.id, punch_type=PunchType.CHECK_OUT, punch_time=correction.requested_check_out, client_ip="0.0.0.0", is_valid_punch=True, validation_message="Applied via approved correction"))
                await self._flush()
                punches = list(await self._repo.list_punches(day.id))
                day.working_hours = _compute_working_hours(punches)
                day.status = AttendanceStatus.PRESENT
            await self._commit()
            await self._audit("attendance_correction.approved", correction.id, actor)
            if day:
                await self.rebuild_monthly_summary(day.employment_id, day.attendance_date.year, day.attendance_date.month, actor_employment_id=actor)
        elif status_str == ApprovalStatus.REJECTED.value:
            if correction.status == AttendanceCorrectionStatus.REJECTED:
                return
            correction.status = AttendanceCorrectionStatus.REJECTED
            await self._commit()
            await self._audit("attendance_correction.rejected", correction.id, actor)

    async def create_policy(self, data: AttendancePolicyCreate, *, actor_employment_id: Optional[int] = None) -> AttendancePolicyResponse:
        current = await self._repo.get_current_policy(as_of=data.effective_from)
        if current and current.effective_to is None:
            await self._repo.close_policy(current.id, data.effective_from)
        policy = AttendancePolicy(**data.model_dump(), effective_to=None, changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID)
        await self._repo.add(policy)
        await self._commit()
        await self._audit("attendance_policy.created", policy.id, actor_employment_id)
        return AttendancePolicyResponse.model_validate(policy)

    async def list_policies(self) -> list[AttendancePolicyResponse]:
        rows = await self._repo.list_policies()
        return [AttendancePolicyResponse.model_validate(r) for r in rows]

    async def get_current_policy(self, *, as_of: Optional[date] = None) -> AttendancePolicyResponse:
        policy = await self._repo.get_current_policy(as_of=as_of)
        if policy is None:
            raise NotFoundError("No effective attendance policy")
        return AttendancePolicyResponse.model_validate(policy)

    async def get_monthly_summary(self, employment_id: int, year: int, month: int) -> MonthlySummaryResponse:
        row = await self._repo.get_monthly_summary(employment_id, year, month)
        if row is None:
            raise NotFoundError("Monthly summary not found; rebuild first")
        return MonthlySummaryResponse.model_validate(row)

    async def rebuild_monthly_summary(self, employment_id: int, year: int, month: int, *, actor_employment_id: Optional[int] = None) -> MonthlySummaryResponse:
        existing = await self._repo.get_monthly_summary(employment_id, year, month)
        if existing and existing.is_locked:
            raise DomainError("Monthly summary is locked and cannot be rebuilt")
        days = await self._repo.list_days_for_month(employment_id, year, month)
        present = absent = half = holiday = week_off = on_leave = Decimal("0")
        working_hours = Decimal("0")
        for d in days:
            if d.status == AttendanceStatus.PRESENT:
                present += 1
            elif d.status == AttendanceStatus.ABSENT:
                absent += 1
            elif d.status == AttendanceStatus.HALF_DAY:
                half += Decimal("0.5")
                present += Decimal("0.5")
            elif d.status == AttendanceStatus.HOLIDAY:
                holiday += 1
            elif d.status == AttendanceStatus.WEEK_OFF:
                week_off += 1
            elif d.status == AttendanceStatus.ON_LEAVE:
                on_leave += 1
            if d.working_hours:
                working_hours += d.working_hours
        expected = present + absent + half
        pct = (present / expected * 100).quantize(Decimal("0.01")) if expected > 0 else None
        now = datetime.now(timezone.utc)
        actor = actor_employment_id
        if existing:
            existing.present_days = present
            existing.absent_days = absent
            existing.half_days = half
            existing.holiday_days = holiday
            existing.week_off_days = week_off
            existing.on_leave_days = on_leave
            existing.working_hours = working_hours
            existing.attendance_percentage = pct
            existing.rebuilt_at = now
            existing.changed_by = actor
            row = existing
        else:
            row = MonthlyAttendanceSummary(employment_id=employment_id, year=year, month=month, present_days=present, absent_days=absent, half_days=half, holiday_days=holiday, week_off_days=week_off, on_leave_days=on_leave, working_hours=working_hours, attendance_percentage=pct, rebuilt_at=now, changed_by=actor, is_locked=False)
            await self._repo.add(row)
        await self._commit()
        await self._audit("attendance.monthly_summary_rebuilt", row.id, actor)
        return MonthlySummaryResponse.model_validate(row)

    async def lock_monthly_summary(self, employment_id: int, year: int, month: int, *, actor_employment_id: Optional[int] = None) -> MonthlySummaryResponse:
        row = await self._repo.get_monthly_summary(employment_id, year, month)
        if row is None:
            raise NotFoundError("Monthly summary not found")
        row.is_locked = True
        row.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("attendance.monthly_summary_locked", row.id, actor_employment_id)
        return MonthlySummaryResponse.model_validate(row)

    async def start_break(self, data: BreakStartRequest, *, actor_employment_id: Optional[int] = None) -> BreakResponse:
        day = await self._repo.get_day_by_id(data.attendance_day_id)
        if day is None:
            raise NotFoundError("Attendance day not found")
        if await self._repo.get_open_break(day.id):
            raise ConflictError("An open break already exists for this day")
        br = AttendanceBreak(attendance_day_id=day.id, break_start=data.break_start or datetime.now(timezone.utc))
        await self._repo.add(br)
        await self._commit()
        await self._audit("attendance.break_started", br.id, actor_employment_id)
        return BreakResponse.model_validate(br)

    async def end_break(self, break_id: int, data: BreakEndRequest, *, actor_employment_id: Optional[int] = None) -> BreakResponse:
        br = await self._repo.get_break_by_id(break_id)
        if br is None:
            raise NotFoundError("Break not found")
        if br.break_end is not None:
            raise DomainError("Break is already ended")
        end = data.break_end or datetime.now(timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        br.break_end = end
        br.duration_minutes = max(0, int((end - br.break_start).total_seconds() // 60))
        await self._commit()
        await self._audit("attendance.break_ended", br.id, actor_employment_id)
        return BreakResponse.model_validate(br)


AttendancePublicService = AttendanceService
