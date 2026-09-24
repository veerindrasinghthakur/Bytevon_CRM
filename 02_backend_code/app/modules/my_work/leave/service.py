"""My Work Leave Service — self-service facade over the leave domain (Q14).

No business logic lives here: every operation delegates to the canonical
leave RequestService / LedgerService so validation, HOLD accounting, and
the approval workflow are identical to the HR/admin paths.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import LeaveRequestStatus
from app.core.exceptions.exception import DomainError
from app.core.services.base_public_service import BasePublicService
from app.modules.leave.ledger.schemas import LeaveCalculateRequest
from app.modules.leave.ledger.service import LedgerService
from app.modules.leave.leave_type.repository import LeaveTypeRepository
from app.modules.leave.request.schemas import LeaveRequestCreate
from app.modules.leave.request.service import RequestService
from app.modules.my_work.leave.schemas import (
    ApplyLeaveContext,
    CreateLeaveRequestInput,
    LeaveBalance,
    LeaveCalculateInput,
    LeaveCalculateResult,
    LeaveListResponse,
    LeaveRequest,
    LeaveTypeOption,
)

_TYPE_ALIASES = {
    "ANNUAL": "EARNED",
    "ANNUAL_LEAVE": "EARNED",
    "LOP": "LOSS_OF_PAY",
    "UNPAID": "LOSS_OF_PAY",
    "COMP-OFF": "COMP_OFF",
}


def _to_leave_type(value: str) -> str:
    """Normalize caller input to a leave_types code; existence is enforced
    by the domain services against the master table."""
    key = (value or "").strip().upper().replace(" ", "_").replace("-", "_")
    if not key:
        raise DomainError("Leave type is required")
    return _TYPE_ALIASES.get(key, key)


class MyWorkLeaveService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._requests = RequestService(session)
        self._ledger = LedgerService(session)
        self._types = LeaveTypeRepository(session)

    async def _approver_map(
        self, approval_ids: set[int]
    ) -> dict[int, dict]:
        """approval_request_id → {name, remarks, decided_on}.

        Decided requests show the decider (latest action); pending ones show
        the department head they are waiting on.
        """
        from sqlalchemy import desc, func, select

        from app.modules.approvals.models.approval_models import (
            ApprovalAction,
            ApprovalRequest as ApprovalRow,
        )
        from app.modules.auth.models.authentication_models import Person
        from app.modules.workforce.department.models import Department
        from app.modules.workforce.models.employment_models import Employment

        out: dict[int, dict] = {}
        if not approval_ids:
            return out
        rows = (
            await self._session.execute(
                select(ApprovalRow).where(ApprovalRow.id.in_(sorted(approval_ids)))
            )
        ).scalars().all()
        by_id = {r.id: r for r in rows}

        latest_action_sub = (
            select(
                ApprovalAction.approval_request_id,
                func.max(ApprovalAction.id).label("action_id"),
            )
            .where(ApprovalAction.approval_request_id.in_(sorted(approval_ids)))
            .group_by(ApprovalAction.approval_request_id)
            .subquery()
        )
        action_rows = (
            await self._session.execute(
                select(ApprovalAction).where(
                    ApprovalAction.id.in_(select(latest_action_sub.c.action_id))
                )
            )
        ).scalars().all()
        latest = {a.approval_request_id: a for a in action_rows}

        need_heads: dict[int, int] = {}
        for aid, req in by_id.items():
            if aid in latest or not req.target_department_id:
                continue
            need_heads[aid] = req.target_department_id
        heads: dict[int, int | None] = {}
        if need_heads:
            dept_rows = (
                await self._session.execute(
                    select(Department.id, Department.department_head_employment_id).where(
                        Department.id.in_(sorted(set(need_heads.values())))
                    )
                )
            ).all()
            head_by_dept = {d[0]: d[1] for d in dept_rows}
            heads = {aid: head_by_dept.get(did) for aid, did in need_heads.items()}

        emp_ids = {a.employment_id for a in latest.values()}
        emp_ids |= {h for h in heads.values() if h}
        names: dict[int, str] = {}
        if emp_ids:
            person_rows = (
                await self._session.execute(
                    select(Employment.id, Person.first_name, Person.last_name)
                    .join(Person, Person.id == Employment.person_id)
                    .where(Employment.id.in_(sorted(emp_ids)))
                )
            ).all()
            names = {
                r[0]: f"{r[1] or ''} {r[2] or ''}".strip() or f"Emp #{r[0]}"
                for r in person_rows
            }
        for aid in approval_ids:
            req = by_id.get(aid)
            if req is None:
                continue
            action = latest.get(aid)
            if action is not None:
                created = action.created_at
                out[aid] = {
                    "name": names.get(action.employment_id, f"Emp #{action.employment_id}"),
                    "remarks": action.remarks,
                    "decided_on": created.date() if hasattr(created, "date") else None,
                }
            else:
                head = heads.get(aid)
                out[aid] = {
                    "name": names.get(head, "") if head else "",
                    "remarks": None,
                    "decided_on": None,
                }
        return out

    async def _approval_ids_for(self, employment_id: int) -> dict[int, int]:
        from sqlalchemy import select

        from app.modules.leave.models.leave_models import LeaveRequest as LeaveRow

        rows = (
            await self._session.execute(
                select(LeaveRow.id, LeaveRow.approval_request_id).where(
                    LeaveRow.employment_id == employment_id,
                    LeaveRow.approval_request_id.is_not(None),
                )
            )
        ).all()
        return {r[0]: r[1] for r in rows}

    async def list_requests(
        self,
        employment_id: int | None = None,
        *,
        status: str | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 1,
    ) -> LeaveListResponse:
        if employment_id is None:
            return LeaveListResponse(items=[], total=0, page=max(1, offset), pageSize=max(1, limit))
        status_enum: LeaveRequestStatus | None = None
        if status:
            try:
                status_enum = LeaveRequestStatus(status.strip().upper())
            except ValueError:
                status_enum = None
        rows = await self._requests.list_requests(
            employment_id=employment_id, status=status_enum, limit=500, offset=0
        )
        approval_by_leave = await self._approval_ids_for(employment_id)
        approvers = await self._approver_map(set(approval_by_leave.values()))
        items: list[LeaveRequest] = []
        for r in rows:
            st = r.status.value if hasattr(r.status, "value") else str(r.status)
            lt = str(r.leave_type)
            if search and search.strip().lower() not in f"{lt} {r.reason or ''}".lower():
                continue
            info = approvers.get(approval_by_leave.get(int(r.id), -1), {})
            items.append(
                LeaveRequest(
                    id=str(r.id),
                    type=lt,
                    from_date=r.start_date,
                    to_date=r.end_date,
                    days=r.days or Decimal("0"),
                    reason=r.reason or "",
                    status=st.title(),
                    applied_on=r.created_at.date()
                    if hasattr(r.created_at, "date")
                    else r.start_date,
                    approver=info.get("name") or None,
                    approver_remarks=info.get("remarks"),
                    decided_on=info.get("decided_on"),
                )
            )
        total = len(items)
        page = max(1, offset)
        page_size = max(1, limit)
        start = (page - 1) * page_size
        return LeaveListResponse(
            items=items[start : start + page_size], total=total, page=page, pageSize=page_size
        )

    async def get_balances(self, employment_id: int | None = None) -> list[LeaveBalance]:
        if employment_id is None:
            return []
        ctx = await self._ledger.get_apply_context(employment_id)
        return [
            LeaveBalance(
                type=str(b.leave_type),
                total=b.total,
                used=b.used,
                remaining=b.remaining,
            )
            for b in ctx.balances
        ]

    async def get_types(self) -> list[LeaveTypeOption]:
        # Catalog comes from the leave_types master table so the
        # self-service list can never drift from the enforced types.
        rows = await self._types.list_types(include_archived=False)
        return [
            LeaveTypeOption(
                value=t.code,
                label=t.name,
                requires_approval=bool(t.requires_approval),
            )
            for t in rows
        ]

    async def get_apply_context(
        self, employment_id: int | None = None
    ) -> ApplyLeaveContext:
        if employment_id is None:
            return ApplyLeaveContext(holidays=[], leaveTypes=[], balances=[])
        ctx = await self._ledger.get_apply_context(employment_id)
        return ApplyLeaveContext(
            holidays=[
                {
                    "date": h.date.isoformat(),
                    "name": h.name,
                    "type": h.holiday_type,
                }
                for h in ctx.holidays
            ],
            leaveTypes=[
                LeaveTypeOption(
                    value=str(t.leave_type),
                    label=t.name,
                    requires_approval=True,
                )
                for t in ctx.leave_types
            ],
            balances=[
                LeaveBalance(
                    type=str(b.leave_type),
                    total=b.total,
                    used=b.used,
                    remaining=b.remaining,
                )
                for b in ctx.balances
            ],
        )

    async def calculate_days(
        self,
        employment_id: int | None = None,
        *,
        input: LeaveCalculateInput,
    ) -> LeaveCalculateResult:
        if employment_id is None:
            raise DomainError("Employment context is required")
        from_date = datetime.strptime(input.from_, "%Y-%m-%d").date()
        to_date = datetime.strptime(input.to, "%Y-%m-%d").date()
        res = await self._ledger.calculate_leave_days(
            LeaveCalculateRequest(
                employment_id=employment_id,
                leave_type=_to_leave_type(input.type),
                start_date=from_date,
                end_date=to_date,
                half_day=input.half_day,
            )
        )
        return LeaveCalculateResult(
            day_cost=res.day_cost,
            balance_remaining=res.balance_remaining,
            estimated_balance_after=res.estimated_balance_after,
            holidays_in_range=[
                {
                    "date": h.date.isoformat(),
                    "name": h.name,
                    "type": h.holiday_type,
                }
                for h in res.holidays_in_range
            ],
        )

    async def submit_request(
        self,
        employment_id: int | None = None,
        *,
        input: CreateLeaveRequestInput,
    ) -> LeaveRequest:
        if employment_id is None:
            raise DomainError("Employment context is required")
        created = await self._requests.submit_request(
            LeaveRequestCreate(
                employment_id=employment_id,
                leave_type=_to_leave_type(input.type),
                start_date=input.from_date,
                end_date=input.to_date,
                reason=input.reason,
            ),
            actor_employment_id=employment_id,
        )
        lt = str(created.leave_type)
        st = created.status.value if hasattr(created.status, "value") else str(created.status)
        info: dict = {}
        if created.approval_request_id:
            info = (await self._approver_map({created.approval_request_id})).get(
                created.approval_request_id, {}
            )
        return LeaveRequest(
            id=str(created.id),
            type=lt,
            from_date=created.start_date,
            to_date=created.end_date,
            days=created.days or Decimal("0"),
            reason=created.reason or "",
            status=st.title(),
            applied_on=created.created_at.date()
            if hasattr(created.created_at, "date")
            else created.start_date,
            approver=info.get("name") or None,
            approver_remarks=info.get("remarks"),
            decided_on=info.get("decided_on"),
            half_day=input.half_day,
        )
