"""MyWorkOverviewService — composes existing SELF services, no new logic."""
from __future__ import annotations

import logging
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.my_work.approvals.service import MyWorkApprovalsService
from app.modules.my_work.attendance.service import MyWorkAttendanceService
from app.modules.my_work.leave.service import MyWorkLeaveService
from app.modules.my_work.overview.schemas import MyWorkOverviewResponse, OverviewUser
from app.modules.my_work.profile.service import ProfileService
from app.modules.my_work.tasks.service import MyWorkTasksService
from app.modules.notifications.center.service import CenterService

logger = logging.getLogger(__name__)


class MyWorkOverviewService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._attendance = MyWorkAttendanceService(session)
        self._leave = MyWorkLeaveService(session)
        self._tasks = MyWorkTasksService(session)
        self._approvals = MyWorkApprovalsService(session)
        self._profile = ProfileService(session)
        self._notifications = CenterService(session)

    async def get_overview(
        self, *, login_id: int | None, employment_id: int | None
    ) -> MyWorkOverviewResponse:
        name = "User"
        department = ""
        employee_code = ""
        shift = "—"
        try:
            me = await self._profile.get_me(login_id=login_id, employment_id=employment_id)
            name = getattr(me, "name", None) or name
            department = getattr(me, "department", None) or ""
            employee_code = getattr(me, "employeeCode", None) or ""
        except Exception:
            logger.exception("Overview profile failed")
        today = await self._attendance.today_info(employment_id)
        try:
            shift = today.shift or shift
        except Exception:
            pass
        week = await self._attendance.week_hours(employment_id)
        balances = await self._leave.get_balances(employment_id)
        tasks_resp = await self._tasks.list_my_tasks(employment_id, limit=5)
        approvals_resp = await self._approvals.list_my_approvals(employment_id, limit=50)

        metrics: list[dict] = []
        notifications: list[dict] = []
        events: list[dict] = []
        unread = 0
        try:
            if employment_id is not None:
                inbox = await self._notifications.list_inbox(employment_id, limit=3)
                unread = int((await self._notifications.unread_count(employment_id)).get("unread", 0))
                for n in inbox:
                    created = n.created_at.isoformat() if n.created_at else ""
                    status = n.status.value if hasattr(n.status, "value") else str(n.status)
                    notifications.append(
                        {
                            "id": n.id,
                            "title": n.title,
                            "body": n.body,
                            "time": created[:16].replace("T", " "),
                            "unread": status == "UNREAD",
                            "icon": "notifications",
                        }
                    )
        except Exception:
            logger.exception("Overview notifications failed")
        try:
            metrics = self._build_metrics(
                employment_id=employment_id,
                balances=balances,
                tasks_total=tasks_resp.total,
                pending=int(getattr(approvals_resp, "total", 0) or 0),
                unread=unread,
                week_total_minutes=week.totalMinutes,
            )
        except Exception:
            logger.exception("Overview metrics failed")
        try:
            events = await self._build_events(employment_id)
        except Exception:
            logger.exception("Overview events failed")
        return MyWorkOverviewResponse(
            user=OverviewUser(
                name=name,
                employmentId=employment_id,
                employeeCode=employee_code,
                department=department,
                todayLabel=date.today().strftime("%A, %B %d, %Y"),
                shift=shift,
            ),
            todayAttendance=today,
            weekHours=week,
            leaveBalances=balances,
            tasks=[t.model_dump(mode="json") for t in tasks_resp.items],
            pendingApprovals=int(getattr(approvals_resp, "total", 0) or 0),
            metrics=metrics,
            notifications=notifications,
            events=events,
        )

    def _build_metrics(
        self,
        *,
        employment_id: int | None,
        balances: list,
        tasks_total: int,
        pending: int,
        unread: int,
        week_total_minutes: int,
    ) -> list[dict]:
        remaining = sum(
            (float(b.remaining) for b in balances if float(b.remaining) > 0), 0.0
        )
        hours = week_total_minutes // 60
        minutes = week_total_minutes % 60
        return [
            {
                "id": "week-hours",
                "label": "Hours this week",
                "value": f"{hours}h {minutes}m",
                "subtitle": "Mon–Sun",
                "icon": "schedule",
                "changeType": "neutral",
            },
            {
                "id": "leave",
                "label": "Leave remaining",
                "value": f"{int(remaining)} days" if remaining == int(remaining) else f"{round(remaining, 1)} days",
                "subtitle": "Across types",
                "icon": "event_busy",
                "changeType": "neutral",
            },
            {
                "id": "tasks",
                "label": "My tasks",
                "value": str(tasks_total),
                "subtitle": "Assigned to me",
                "icon": "task_alt",
                "changeType": "neutral",
            },
            {
                "id": "approvals",
                "label": "Pending approvals",
                "value": str(pending),
                "subtitle": "Awaiting action",
                "icon": "hourglass_top",
                "changeType": "neutral" if pending == 0 else "negative",
            },
            {
                "id": "notifications",
                "label": "Unread",
                "value": str(unread),
                "subtitle": "Notifications",
                "icon": "notifications",
                "changeType": "neutral" if unread == 0 else "negative",
            },
        ]

    async def _build_events(self, employment_id: int | None) -> list[dict]:
        """Upcoming events: holidays + my tasks due in the next 14 days."""
        from datetime import date as _date

        events: list[dict] = []
        today = _date.today()
        horizon = today + timedelta(days=14)
        try:
            ctx = await self._leave.get_apply_context(employment_id)
            for h in ctx.holidays:
                raw = h.get("date") if isinstance(h, dict) else getattr(h, "date", None)
                day = raw.date() if hasattr(raw, "date") else _date.fromisoformat(str(raw))
                if today <= day <= horizon:
                    events.append(
                        {
                            "id": f"hol-{day.isoformat()}",
                            "title": h.get("name") if isinstance(h, dict) else getattr(h, "name", ""),
                            "subtitle": "Holiday",
                            "month": day.strftime("%b"),
                            "day": str(day.day),
                            "icon": "celebration",
                        }
                    )
        except Exception:
            logger.exception("Overview holiday events failed")
        try:
            mine = await self._tasks.list_my_tasks(employment_id, limit=50)
            for t in mine.items:
                if t.due_date is None or not (today <= t.due_date <= horizon):
                    continue
                events.append(
                    {
                        "id": f"task-{t.id}",
                        "title": t.name,
                        "subtitle": f"Due {t.due_date.isoformat()}",
                        "month": t.due_date.strftime("%b"),
                        "day": str(t.due_date.day),
                        "icon": "task_alt",
                    }
                )
        except Exception:
            logger.exception("Overview task events failed")
        return events[:6]


OverviewService = MyWorkOverviewService
