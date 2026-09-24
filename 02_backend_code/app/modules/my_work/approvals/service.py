"""My Work Approvals Service — self-service facade over approvals (Q14).

Shows the employee their own submitted requests plus requests pending in
their department queue (manager-hierarchy target). No duplicate logic.
"""
from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import ApprovalStatus
from app.core.services.base_public_service import BasePublicService
from app.modules.approvals.request.service import RequestService
from app.modules.my_work.approvals.schemas import ApprovalListResponse, ApprovalRequest

logger = logging.getLogger(__name__)

_REQUEST_TYPE_LABELS = {
    "LEAVE_REQUEST": "Leave",
    "ATTENDANCE_CORRECTION": "Attendance Correction",
    "EXPENSE": "Expense",
    "NEW_HIRE": "New Hire",
}


class MyWorkApprovalsService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._approvals = RequestService(session)

    async def list_my_approvals(
        self,
        employment_id: int | None = None,
        *,
        status: str | None = None,
        search: str | None = None,
        limit: int = 20,
    ) -> ApprovalListResponse:
        if employment_id is None:
            return ApprovalListResponse(items=[], total=0, page=1, pageSize=max(1, limit))
        status_enum: ApprovalStatus | None = None
        if status:
            try:
                status_enum = ApprovalStatus(status.strip().upper())
            except ValueError:
                status_enum = None
        # Own submitted requests.
        mine = await self._approvals.list_requests(
            requester_employment_id=employment_id,
            status=status_enum,
            limit=500,
        )
        # Department queue: pending requests targeted at my department
        # (Q10 manager hierarchy) that I did not submit myself.
        dept_id: int | None = None
        try:
            from app.modules.workforce.employee.repository import EmployeeRepository

            asg = await EmployeeRepository(self._session).get_current_assignment(
                employment_id
            )
            if asg is not None and asg.department_id is not None:
                dept_id = int(asg.department_id)
        except Exception:
            dept_id = None
        queued: list = []
        if dept_id is not None:
            queued = await self._approvals.list_requests(
                status=status_enum or ApprovalStatus.PENDING,
                target_department_id=dept_id,
                limit=500,
            )
        seen: set[int] = set()
        items: list[ApprovalRequest] = []
        for r in list(mine) + list(queued):
            if r.id in seen:
                continue
            seen.add(r.id)
            if search and search.strip().lower() not in f"{r.request_type} {r.reference_id}".lower():
                continue
            st = r.status.value if hasattr(r.status, "value") else str(r.status)
            rtype = getattr(r.request_type, "value", r.request_type)
            rtype = str(rtype)
            title, summary = await self._summarize(rtype, r.reference_id)
            items.append(
                ApprovalRequest(
                    id=str(r.id),
                    request_type=rtype,
                    request_reason=summary or f"{r.request_type} #{r.reference_id}",
                    status=st.title() if st.isupper() else st,
                    submitted_on=r.created_at.date()
                    if hasattr(r.created_at, "date")
                    else None,
                    requester=await self._requester_name(r.requester_employment_id),
                    title=title,
                    summary=summary,
                )
            )
        items.sort(key=lambda i: int(i.id), reverse=True)
        page_size = max(1, limit)
        return ApprovalListResponse(
            items=items[:page_size], total=len(items), page=1, pageSize=page_size
        )

    async def _requester_name(self, employment_id: int | None) -> str:
        if employment_id is None:
            return "—"
        try:
            from app.modules.auth.models import Person
            from app.modules.workforce.models import Employment

            emp = await self._session.get(Employment, int(employment_id))
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
            logger.exception("Approval requester lookup failed for %s", employment_id)
        return f"Emp #{employment_id}"

    async def _summarize(
        self, request_type: str, reference_id: int | None
    ) -> tuple[str, str]:
        """Human title + summary for an approval item (best effort)."""
        label = _REQUEST_TYPE_LABELS.get(str(request_type), str(request_type))
        title = f"{label} #{reference_id}" if reference_id else label
        try:
            if request_type == "LEAVE_REQUEST" and reference_id:
                from app.modules.leave.request.service import (
                    RequestService as LeaveRequestService,
                )

                detail = await LeaveRequestService(self._session).get_request(
                    int(reference_id)
                )
                start = getattr(detail.start_date, "isoformat", lambda: str(detail.start_date))()
                end = getattr(detail.end_date, "isoformat", lambda: str(detail.end_date))()
                days = getattr(detail, "days", None)
                if days not in (None, ""):
                    try:
                        from decimal import Decimal

                        days_txt = f" · {Decimal(str(days)).normalize()} day(s)"
                    except Exception:
                        days_txt = f" · {days} day(s)"
                else:
                    days_txt = ""
                reason = getattr(detail, "reason", "") or ""
                summary = f"{detail.leave_type} · {start} → {end}{days_txt}"
                if reason:
                    summary += f" · {reason}"
                return title, summary
            if request_type == "ATTENDANCE_CORRECTION" and reference_id:
                from app.modules.workforce.attendance.service import (
                    AttendanceService as WorkforceAttendanceService,
                )

                corr = await WorkforceAttendanceService(self._session).get_correction(
                    int(reference_id)
                )
                day = await WorkforceAttendanceService(self._session).get_day(
                    corr.attendance_day_id
                )
                raw_day = getattr(day, "attendance_date", "")
                day_txt = raw_day.isoformat() if hasattr(raw_day, "isoformat") else str(raw_day)
                ci = corr.requested_check_in.strftime("%H:%M") if corr.requested_check_in else "—"
                co = corr.requested_check_out.strftime("%H:%M") if corr.requested_check_out else "—"
                summary = f"Correction · {day_txt} · {ci}–{co}"
                if corr.reason:
                    summary += f" · {corr.reason}"
                return title, summary
        except Exception:
            logger.exception(
                "Approval summary failed for %s #%s", request_type, reference_id
            )
        return title, ""
