"""MyWorkOverviewService — composes existing SELF services, no new logic."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.my_work.approvals.service import MyWorkApprovalsService
from app.modules.my_work.attendance.service import MyWorkAttendanceService
from app.modules.my_work.leave.service import MyWorkLeaveService
from app.modules.my_work.overview.schemas import MyWorkOverviewResponse, OverviewUser
from app.modules.my_work.profile.service import ProfileService
from app.modules.my_work.tasks.service import MyWorkTasksService


class MyWorkOverviewService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._attendance = MyWorkAttendanceService(session)
        self._leave = MyWorkLeaveService(session)
        self._tasks = MyWorkTasksService(session)
        self._approvals = MyWorkApprovalsService(session)
        self._profile = ProfileService(session)

    async def get_overview(
        self, *, login_id: int | None, employment_id: int | None
    ) -> MyWorkOverviewResponse:
        name = "User"
        shift = "—"
        try:
            me = await self._profile.get_me(login_id=login_id, employment_id=employment_id)
            name = getattr(me, "name", None) or getattr(me, "full_name", None) or name
        except Exception:
            pass
        today = await self._attendance.today_info(employment_id)
        try:
            shift = today.shift or shift
        except Exception:
            pass
        week = await self._attendance.week_hours(employment_id)
        balances = await self._leave.get_balances(employment_id)
        tasks_resp = await self._tasks.list_my_tasks(employment_id, limit=5)
        approvals_resp = await self._approvals.list_my_approvals(employment_id, limit=50)
        return MyWorkOverviewResponse(
            user=OverviewUser(
                name=name, employmentId=employment_id, todayLabel="Today", shift=shift
            ),
            todayAttendance=today,
            weekHours=week,
            leaveBalances=balances,
            tasks=list(getattr(tasks_resp, "items", []) or []),
            pendingApprovals=int(getattr(approvals_resp, "total", 0) or 0),
        )


OverviewService = MyWorkOverviewService
