"""Executive dashboard aggregation — scope-aware counts from domain tables.

Scope contract (mirrors app.core.authorization ranks):
- Super admin / ORGANIZATION employment grant → org-wide numbers.
- DEPARTMENT / LOCATION → employments sharing the viewer's current
  department / location (current assignment = effective_to IS NULL).
- TEAM → same-department fallback (team membership lives in project teams;
  department is the closest stable boundary).
- SELF (or no grant) → viewer's own employment only.

Every block is best-effort (try/except with safe defaults) so one empty or
failing domain never breaks the whole dashboard response.
"""
from __future__ import annotations

import logging
from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext
from app.core.db.enums import (
    ApprovalStatus,
    AttendanceStatus,
    EmploymentState,
    LeaveRequestStatus,
    LeadStatus,
    TaskStatus,
)

logger = logging.getLogger(__name__)

ACTIVE_EMPLOYMENT_STATES = (
    EmploymentState.ONBOARDING,
    EmploymentState.PROBATION,
    EmploymentState.CONFIRMED,
)
OPEN_TASK_STATUSES = (TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.BLOCKED)
CLOSED_LEAD_STATUSES = (LeadStatus.WON, LeadStatus.LOST)


def _initials(first: str | None, last: str | None, fallback: str) -> str:
    parts = [p for p in (first, last) if p]
    if not parts:
        return fallback
    return "".join(p[0] for p in parts[:2]).upper()


def _relative(ts: datetime | None) -> str:
    if ts is None:
        return ""
    now = datetime.now(UTC)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=UTC)
    delta = now - ts
    mins = int(delta.total_seconds() // 60)
    if mins < 1:
        return "just now"
    if mins < 60:
        return f"{mins}m ago"
    hours = mins // 60
    if hours < 24:
        return f"{hours}h ago"
    days = hours // 24
    if days < 30:
        return f"{days}d ago"
    return ts.date().isoformat()


class ExecutiveDashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def _scalar(self, stmt: Any, default: int = 0) -> int:
        try:
            res = await self._session.execute(stmt)
            return int(res.scalar() or 0)
        except Exception:
            logger.exception("Dashboard aggregate query failed")
            return default

    async def _resolve_visible_employment_ids(self, auth: AuthContext) -> list[int] | None:
        """Employment ids the viewer may see. None = whole organization."""
        from app.modules.workforce.models.employment_models import Employment, EmploymentAssignment

        if auth.is_super_admin:
            return None
        scope = (auth.scopes.get("employment") or "SELF").upper()
        if scope == "ORGANIZATION":
            return None
        if scope == "SELF":
            return [auth.employment_id]
        try:
            current = (
                await self._session.execute(
                    select(
                        EmploymentAssignment.department_id,
                        EmploymentAssignment.location_id,
                    ).where(
                        EmploymentAssignment.employment_id == auth.employment_id,
                        EmploymentAssignment.effective_to.is_(None),
                    )
                )
            ).one_or_none()
            column = None
            value = None
            if current is not None:
                if scope == "DEPARTMENT" or scope == "TEAM":
                    column, value = EmploymentAssignment.department_id, current[0]
                elif scope == "LOCATION":
                    column, value = EmploymentAssignment.location_id, current[1]
            if column is None or value is None:
                return [auth.employment_id]
            stmt = (
                select(Employment.id)
                .join(
                    EmploymentAssignment,
                    EmploymentAssignment.employment_id == Employment.id,
                )
                .where(
                    EmploymentAssignment.effective_to.is_(None),
                    column == value,
                )
            )
            res = await self._session.execute(stmt)
            ids = list(res.scalars().all())
            return ids or [auth.employment_id]
        except Exception:
            logger.exception("Dashboard scope resolution failed")
            return [auth.employment_id]

    async def get_executive(self, *, auth: AuthContext) -> dict[str, Any]:
        from app.modules.admin.audit.models import AuditLog
        from app.modules.approvals.models.approval_models import ApprovalRequest
        from app.modules.auth.models.authentication_models import Person
        from app.modules.leave.models.leave_models import LeaveRequest
        from app.modules.project.task.models import Task
        from app.modules.sales.models.sales_models import Lead
        from app.modules.workforce.attendance.models import AttendanceDay
        from app.modules.workforce.models.employment_models import Employment

        today = date.today()
        visible_ids = await self._resolve_visible_employment_ids(auth)
        emp_scope = "ORGANIZATION" if visible_ids is None else (auth.scopes.get("employment") or "SELF").upper()

        def in_scope(column: Any) -> Any:
            if visible_ids is None:
                return True
            return column.in_(visible_ids)

        employees_total = await self._scalar(
            select(func.count(Employment.id)).where(in_scope(Employment.id))
        )
        employees_active = await self._scalar(
            select(func.count(Employment.id)).where(
                Employment.current_state.in_(ACTIVE_EMPLOYMENT_STATES),
                in_scope(Employment.id),
            )
        )
        present_today = await self._scalar(
            select(func.count(AttendanceDay.id)).where(
                AttendanceDay.attendance_date == today,
                AttendanceDay.status == AttendanceStatus.PRESENT,
                in_scope(AttendanceDay.employment_id),
            )
        )
        marked_today = await self._scalar(
            select(func.count(AttendanceDay.id)).where(
                AttendanceDay.attendance_date == today,
                in_scope(AttendanceDay.employment_id),
            )
        )
        attendance_pct = round(present_today / marked_today * 100, 1) if marked_today else 0.0
        pending_leaves = await self._scalar(
            select(func.count(LeaveRequest.id)).where(
                LeaveRequest.status == LeaveRequestStatus.PENDING,
                in_scope(LeaveRequest.employment_id),
            )
        )
        # Tasks: assignee in scope, plus unassigned (actionable by anyone).
        task_scope_filter = (
            True
            if visible_ids is None
            else ((Task.assignee_employment_id.in_(visible_ids)) | (Task.assignee_employment_id.is_(None)))
        )
        open_tasks = await self._scalar(
            select(func.count(Task.id)).where(
                Task.status.in_(OPEN_TASK_STATUSES),
                task_scope_filter,
            )
        )
        # Leads: backend list requires ORGANIZATION; scoped viewers see only
        # assigned (plus unassigned) pipeline on the dashboard.
        lead_scope_filter = (
            True
            if visible_ids is None
            else ((Lead.assigned_employment_id.in_(visible_ids)) | (Lead.assigned_employment_id.is_(None)))
        )
        open_leads = await self._scalar(
            select(func.count(Lead.id)).where(
                Lead.status.notin_(CLOSED_LEAD_STATUSES),
                lead_scope_filter,
            )
        )
        pending_approvals = await self._scalar(
            select(func.count(ApprovalRequest.id)).where(
                ApprovalRequest.status == ApprovalStatus.PENDING,
                in_scope(ApprovalRequest.requester_employment_id),
            )
        )
        yesterday = today - timedelta(days=1)
        present_yesterday = await self._scalar(
            select(func.count(AttendanceDay.id)).where(
                AttendanceDay.attendance_date == yesterday,
                AttendanceDay.status == AttendanceStatus.PRESENT,
                in_scope(AttendanceDay.employment_id),
            )
        )
        attendance_delta = present_today - present_yesterday
        attendance_trend = (
            f"{attendance_delta:+d} vs yesterday" if marked_today or present_yesterday else ""
        )
        new_joiners = await self._scalar(
            select(func.count(Employment.id)).where(
                Employment.joining_date >= today - timedelta(days=30),
                in_scope(Employment.id),
            )
        )
        employees_trend = f"+{new_joiners} this month" if new_joiners else ""
        month_start = today.replace(day=1)
        won_month = await self._scalar(
            select(func.count(Lead.id)).where(
                Lead.status == LeadStatus.WON,
                Lead.is_archived.is_(False),
                Lead.created_at >= datetime(month_start.year, month_start.month, 1, tzinfo=UTC),
                lead_scope_filter,
            )
        )
        pipeline_trend = f"+{won_month} won" if won_month else ""

        pending: list[dict[str, Any]] = []
        try:
            stmt = (
                select(
                    ApprovalRequest.id,
                    ApprovalRequest.request_type,
                    ApprovalRequest.reference_id,
                    Person.first_name,
                    Person.last_name,
                )
                .join(Employment, Employment.id == ApprovalRequest.requester_employment_id)
                .join(Person, Person.id == Employment.person_id)
                .where(
                    ApprovalRequest.status == ApprovalStatus.PENDING,
                    in_scope(ApprovalRequest.requester_employment_id),
                )
                .order_by(desc(ApprovalRequest.id))
                .limit(5)
            )
            res = await self._session.execute(stmt)
            for row in res.all():
                name = f"{row[3] or ''} {row[4] or ''}".strip() or f"Emp #{row[0]}"
                pending.append(
                    {
                        "id": row[0],
                        "name": name,
                        "detail": f"{row[1]} #{row[2]}",
                        "initials": _initials(row[3], row[4], "?"),
                    }
                )
        except Exception:
            logger.exception("Dashboard pending approvals failed")

        # Audit trail is org-level: only viewers with an audit grant see it.
        activities: list[dict[str, Any]] = []
        can_see_audit = auth.is_super_admin or bool(auth.scopes.get("audit"))
        if can_see_audit:
            try:
                stmt = select(AuditLog).order_by(desc(AuditLog.id)).limit(8)
                res = await self._session.execute(stmt)
                for log in res.scalars().all():
                    action = log.action.value if hasattr(log.action, "value") else str(log.action)
                    activities.append(
                        {
                            "id": f"act-{log.id}",
                            "icon": "history",
                            "title": action.replace("_", " ").title(),
                            "description": log.description or "",
                            "timestamp": _relative(log.created_at),
                            "badge": "AUDIT",
                        }
                    )
            except Exception:
                logger.exception("Dashboard activities failed")

        attendance_bars: list[int] = []
        try:
            start = today - timedelta(days=29)
            stmt = (
                select(AttendanceDay.attendance_date, func.count(AttendanceDay.id))
                .where(
                    AttendanceDay.attendance_date >= start,
                    AttendanceDay.attendance_date <= today,
                    AttendanceDay.status == AttendanceStatus.PRESENT,
                    in_scope(AttendanceDay.employment_id),
                )
                .group_by(AttendanceDay.attendance_date)
            )
            res = await self._session.execute(stmt)
            by_date = {r[0]: int(r[1]) for r in res.all()}
            peak = max(by_date.values()) if by_date else 0
            for i in range(30):
                d = start + timedelta(days=i)
                count = by_date.get(d, 0)
                attendance_bars.append(round(count / peak * 100) if peak else 0)
        except Exception:
            logger.exception("Dashboard attendance trend failed")

        # Pipeline trend: open-lead quotation summed per month, last 8 months.
        revenue_bars: list[int] = []
        revenue_months: list[str] = []
        try:
            month_starts: list[date] = []
            y, m = today.year, today.month
            for _ in range(8):
                month_starts.append(date(y, m, 1))
                m -= 1
                if m == 0:
                    m, y = 12, y - 1
            month_starts.reverse()
            sums: list[float] = []
            for idx, ms in enumerate(month_starts):
                me = month_starts[idx + 1] if idx + 1 < len(month_starts) else today + timedelta(days=1)
                stmt = (
                    select(func.coalesce(func.sum(Lead.quotation), 0))
                    .where(
                        Lead.status.notin_(CLOSED_LEAD_STATUSES),
                        Lead.is_archived.is_(False),
                        func.date(Lead.created_at) >= ms,
                        func.date(Lead.created_at) < me,
                        lead_scope_filter,
                    )
                )
                res = await self._session.execute(stmt)
                sums.append(float(res.scalar() or 0))
                revenue_months.append(ms.strftime("%b"))
            peak = max(sums) if sums and max(sums) > 0 else 0
            revenue_bars = [round(s / peak * 100) if peak else 0 for s in sums]
        except Exception:
            logger.exception("Dashboard pipeline trend failed")

        user_name = "there"
        try:
            stmt = (
                select(Person.first_name)
                .join(Employment, Employment.person_id == Person.id)
                .where(Employment.id == auth.employment_id)
            )
            res = await self._session.execute(stmt)
            first = res.scalar()
            if first:
                user_name = str(first)
        except Exception:
            logger.exception("Dashboard user lookup failed")

        return {
            "kpis": [
                {"label": "Employees", "value": str(employees_active), "trend": employees_trend, "up": True, "icon": "groups"},
                {"label": "Attendance", "value": f"{attendance_pct}%", "trend": attendance_trend, "up": attendance_delta >= 0, "icon": "how_to_reg"},
                {"label": "Leave Requests", "value": str(pending_leaves), "trend": "", "up": False, "icon": "event_busy"},
                {"label": "Pipeline", "value": str(open_leads), "trend": pipeline_trend, "up": True, "icon": "trending_up"},
                {"label": "Open Tasks", "value": str(open_tasks), "trend": "", "up": True, "icon": "task_alt"},
            ],
            "pending": pending,
            "activities": activities,
            "meta": {
                "greetingName": user_name,
                "dateLine": today.strftime("%A, %B %d, %Y"),
                "activeUsers": str(employees_total),
                "presentToday": str(present_today),
                "attendanceBars": attendance_bars,
                "revenueBars": revenue_bars,
                "months": revenue_months,
                "scope": emp_scope if auth.is_super_admin is False else "ORGANIZATION",
            },
            "quickActions": [],
            "approvalsPending": pending_approvals,
            "pipeline": {"openLeads": open_leads},
            "attendance": {
                "presentToday": present_today,
                "markedToday": marked_today,
                "attendancePct": attendance_pct,
            },
        }

    async def get_employee(self, *, auth: AuthContext) -> dict[str, Any]:
        """Self dashboard: hero, KPIs, week bars, leave summary, my tasks."""
        from app.modules.auth.models.authentication_models import Person
        from app.modules.leave.models.leave_models import LeaveRequest
        from app.modules.my_work.attendance.service import MyWorkAttendanceService
        from app.modules.notifications.center.service import CenterService
        from app.modules.project.task.models import Task
        from app.modules.workforce.attendance.models import AttendanceDay
        from app.modules.workforce.department.models import Department
        from app.modules.workforce.models.employment_models import (
            Employment,
            EmploymentAssignment,
            Position,
        )
        from app.modules.workforce.shift.models import Shift

        emp_id = auth.employment_id
        today = date.today()

        name, code, dept, position = "there", "", "", ""
        shift_label = "—"
        try:
            stmt = (
                select(
                    Person.first_name,
                    Person.last_name,
                    Employment.employee_code,
                    Department.name,
                    Position.name,
                    Shift.name,
                    Shift.start_time,
                    Shift.end_time,
                )
                .join(Employment, Employment.person_id == Person.id)
                .join(
                    EmploymentAssignment,
                    (EmploymentAssignment.employment_id == Employment.id)
                    & (EmploymentAssignment.effective_to.is_(None)),
                    isouter=True,
                )
                .join(Department, Department.id == EmploymentAssignment.department_id, isouter=True)
                .join(Position, Position.id == EmploymentAssignment.position_id, isouter=True)
                .join(Shift, Shift.id == EmploymentAssignment.shift_id, isouter=True)
                .where(Employment.id == emp_id)
            )
            res = await self._session.execute(stmt)
            row = res.one_or_none()
            if row:
                first = (row[0] or "").strip()
                last = (row[1] or "").strip()
                name = f"{first} {last}".strip() or "there"
                code = str(row[2] or "")
                dept = str(row[3] or "")
                position = str(row[4] or "")
                if row[5] or row[6]:
                    start = str(row[6])[:5] if row[6] else ""
                    end = str(row[7])[:5] if row[7] else ""
                    shift_label = str(row[5] or f"{start} - {end}".strip(" -"))
        except Exception:
            logger.exception("Employee dashboard identity failed")

        check_in, check_in_note, total_hours, total_hours_note = "—", "", "0h", ""
        week_bars: list[dict[str, Any]] = []
        today_index = (today.weekday() + 1) % 7
        month_pct = 0.0
        try:
            att = MyWorkAttendanceService(self._session)
            info = await att.today_info(emp_id)
            week = await att.week_hours(emp_id)
            if info.checkIn:
                try:
                    check_in = datetime.fromisoformat(info.checkIn).strftime("%H:%M")
                except ValueError:
                    check_in = info.checkIn[11:16]
                check_in_note = info.status.replace("_", " ").title()
            else:
                check_in_note = info.status.replace("_", " ").title() if info.status else ""
            if info.shift and info.shift != "-":
                shift_label = info.shift
            worked = int(info.workedMinutes or 0)
            total_hours = f"{worked // 60}h {worked % 60}m" if worked else "0h"
            total_hours_note = f"Day {today.strftime('%a, %b %d')}"
            by_date = {d.date: d for d in week.days}
            monday = today - timedelta(days=today.weekday())
            for i in range(7):
                d = monday + timedelta(days=i)
                key = d.isoformat()
                hit = by_date.get(key)
                mins = int(hit.minutes) if hit else 0
                week_bars.append(
                    {
                        "pct": round(min(mins / 480, 1) * 100),
                        "isWeekend": d.weekday() >= 5,
                    }
                )
            month_start = today.replace(day=1)
            marked = await self._scalar(
                select(func.count(AttendanceDay.id)).where(
                    AttendanceDay.employment_id == emp_id,
                    AttendanceDay.attendance_date >= month_start,
                )
            )
            present = await self._scalar(
                select(func.count(AttendanceDay.id)).where(
                    AttendanceDay.employment_id == emp_id,
                    AttendanceDay.attendance_date >= month_start,
                    AttendanceDay.status == AttendanceStatus.PRESENT,
                )
            )
            month_pct = round(present / marked * 100, 1) if marked else 0.0
        except Exception:
            logger.exception("Employee dashboard attendance failed")

        leave_summary: list[dict[str, Any]] = []
        leave_remaining = 0.0
        try:
            from app.modules.leave.ledger.service import LedgerService

            balances = await LedgerService(self._session).get_balances(emp_id)
            for b in balances.balances:
                total = float(b.balance_days)
                if total <= 0:
                    continue
                leave_remaining += total
                leave_summary.append(
                    {
                        "name": b.leave_type.replace("_", " ").title(),
                        "used": f"{total} days available",
                        "left": str(int(total)) if total == int(total) else str(round(total, 1)),
                    }
                )
        except Exception:
            logger.exception("Employee dashboard leave failed")

        tasks: list[dict[str, Any]] = []
        open_tasks = 0
        try:
            open_tasks = await self._scalar(
                select(func.count(Task.id)).where(
                    Task.assignee_employment_id == emp_id,
                    Task.status.in_(OPEN_TASK_STATUSES),
                )
            )
            stmt = (
                select(Task)
                .where(
                    Task.assignee_employment_id == emp_id,
                    Task.status.in_(OPEN_TASK_STATUSES),
                )
                .order_by(Task.due_date.is_(None), Task.due_date, desc(Task.id))
                .limit(4)
            )
            res = await self._session.execute(stmt)
            for t in res.scalars().all():
                pr = t.priority.value if hasattr(t.priority, "value") else str(t.priority or "")
                st = t.status.value if hasattr(t.status, "value") else str(t.status or "")
                tasks.append(
                    {
                        "name": t.title,
                        "priority": pr.replace("_", " ").title(),
                        "due": t.due_date.isoformat() if t.due_date else "—",
                        "status": st.replace("_", " ").title(),
                        "est": f"{t.estimated_hours}h" if t.estimated_hours else "—",
                    }
                )
        except Exception:
            logger.exception("Employee dashboard tasks failed")

        pending_approvals = 0
        try:
            pending_approvals = await self._scalar(
                select(func.count(ApprovalRequest.id)).where(
                    ApprovalRequest.requester_employment_id == emp_id,
                    ApprovalRequest.status == ApprovalStatus.PENDING,
                )
            )
        except Exception:
            logger.exception("Employee dashboard approvals failed")

        unread = 0
        try:
            unread = int((await CenterService(self._session).unread_count(emp_id)).get("unread", 0))
        except Exception:
            logger.exception("Employee dashboard notifications failed")

        return {
            "kpis": [
                {"label": "Attendance", "value": f"{month_pct}%", "note": "this month", "icon": "how_to_reg", "color": "text-secondary"},
                {"label": "Leave Balance", "value": f"{int(leave_remaining)}d" if leave_remaining == int(leave_remaining) else f"{round(leave_remaining, 1)}d", "note": "remaining", "icon": "event_busy", "color": "text-secondary"},
                {"label": "Pending Approvals", "value": str(pending_approvals), "note": "awaiting", "icon": "hourglass_top", "color": "text-secondary"},
                {"label": "Open Tasks", "value": str(open_tasks), "note": "assigned to me", "icon": "task_alt", "color": "text-secondary"},
                {"label": "Unread", "value": str(unread), "note": "notifications", "icon": "notifications", "color": "text-secondary"},
            ],
            "tasks": tasks,
            "leaveSummary": leave_summary,
            "meta": {
                "name": name,
                "employeeId": code,
                "department": dept or position,
                "todayLabel": today.strftime("%A, %B %d, %Y"),
                "shift": shift_label,
                "checkIn": check_in,
                "checkInNote": check_in_note,
                "totalHours": total_hours,
                "totalHoursNote": total_hours_note,
                "weekBars": week_bars,
            },
            "quickActions": [
                {"label": "Apply Leave", "icon": "event_busy", "to": "/my-work/leave/apply"},
                {"label": "Mark Attendance", "icon": "how_to_reg", "to": "/my-work/attendance/mark"},
                {"label": "My Tasks", "icon": "task_alt", "to": "/my-work/tasks"},
                {"label": "Request Correction", "icon": "edit_calendar", "to": "/my-work/attendance/corrections"},
                {"label": "My Requests", "icon": "approval", "to": "/my-work/requests"},
            ],
        }


DashboardService = ExecutiveDashboardService
