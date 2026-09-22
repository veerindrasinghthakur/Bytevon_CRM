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
        if scope in ("SELF", "CUSTOM"):
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
        months: list[str] = []
        try:
            start = today - timedelta(days=9)
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
            for i in range(10):
                d = start + timedelta(days=i)
                attendance_bars.append(by_date.get(d, 0))
                months.append(d.strftime("%a"))
        except Exception:
            logger.exception("Dashboard attendance trend failed")

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
                {"label": "Employees", "value": str(employees_active), "trend": "", "up": True, "icon": "groups"},
                {"label": "Attendance", "value": f"{attendance_pct}%", "trend": "", "up": True, "icon": "how_to_reg"},
                {"label": "Leave Requests", "value": str(pending_leaves), "trend": "", "up": False, "icon": "event_busy"},
                {"label": "Pipeline", "value": str(open_leads), "trend": "", "up": True, "icon": "trending_up"},
                {"label": "Open Tasks", "value": str(open_tasks), "trend": "", "up": True, "icon": "task_alt"},
            ],
            "pending": pending,
            "activities": activities,
            "meta": {
                "greetingName": user_name,
                "dateLine": today.strftime("%A, %B %d, %Y"),
                "uptime": "",
                "activeUsers": str(employees_total),
                "attendanceBars": attendance_bars,
                "revenueBars": [],
                "months": months,
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


DashboardService = ExecutiveDashboardService
