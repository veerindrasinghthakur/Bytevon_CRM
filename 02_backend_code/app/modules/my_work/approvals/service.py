"""My Work Approvals Service — self-service facade over approvals (Q14).

Shows the employee their own submitted requests plus requests pending in
their department queue (manager-hierarchy target). No duplicate logic.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import ApprovalStatus
from app.core.services.base_public_service import BasePublicService
from app.modules.approvals.request.service import RequestService
from app.modules.my_work.approvals.schemas import ApprovalListResponse, ApprovalRequest


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
            items.append(
                ApprovalRequest(
                    id=str(r.id),
                    request_type=r.request_type,
                    request_reason=f"{r.request_type} #{r.reference_id}",
                    status=st.title() if st.isupper() else st,
                    submitted_on=r.created_at.date()
                    if hasattr(r.created_at, "date")
                    else None,
                    requester=f"Emp #{r.requester_employment_id}",
                )
            )
        items.sort(key=lambda i: int(i.id), reverse=True)
        page_size = max(1, limit)
        return ApprovalListResponse(
            items=items[:page_size], total=len(items), page=1, pageSize=page_size
        )
