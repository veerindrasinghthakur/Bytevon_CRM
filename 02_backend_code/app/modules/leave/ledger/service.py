"""LedgerService — balances, ledger posts, apply-context, day calculation."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import LeaveType, leave_type_label
from app.core.exceptions.exception import NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.leave.ledger.repository import LedgerRepository
from app.modules.leave.ledger.schemas import (
    ApplyLeaveBalanceItem,
    ApplyLeaveContextResponse,
    HolidayItem,
    LeaveBalanceItem,
    LeaveBalanceResponse,
    LeaveCalculateRequest,
    LeaveCalculateResponse,
    LeaveLedgerCreate,
    LeaveLedgerResponse,
    LeaveTypeOptionItem,
)
from app.modules.leave.models import LeaveLedger
from app.modules.leave.policy.service import PolicyService


def _working_days(
    start: date,
    end: date,
    *,
    holiday_dates: set[date],
    half_day: bool = False,
) -> Decimal:
    # Q13: delegate to the canonical calculator so preview and submit agree.
    from app.modules.leave.leave_days import working_days as _canonical

    return _canonical(start, end, holiday_dates=holiday_dates, half_day=half_day)


class LedgerService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = LedgerRepository(session)
        self._policy = PolicyService(session)

    async def post_ledger_entry(
        self,
        data: LeaveLedgerCreate,
        *,
        actor_employment_id: int | None = None,
    ) -> LeaveLedgerResponse:
        entry = LeaveLedger(
            employment_id=data.employment_id,
            leave_type=data.leave_type,
            transaction_type=data.transaction_type,
            days=data.days,
            reference_type=data.reference_type,
            reference_id=data.reference_id,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(entry)
        await self._commit()
        await self._audit("leave_ledger.posted", entry.id, actor_employment_id)
        return LeaveLedgerResponse.model_validate(entry)

    async def list_ledger(
        self,
        employment_id: int,
        *,
        leave_type: LeaveType | None = None,
        limit: int = 200,
    ) -> list[LeaveLedgerResponse]:
        rows = await self._repo.list_ledger(
            employment_id, leave_type=leave_type, limit=limit
        )
        return [LeaveLedgerResponse.model_validate(r) for r in rows]

    async def get_balances(self, employment_id: int) -> LeaveBalanceResponse:
        rows = await self._repo.sum_balances_by_type(employment_id)
        balances = [
            LeaveBalanceItem(leave_type=lt, balance_days=Decimal(str(total)))
            for lt, total in rows
        ]
        present = {b.leave_type for b in balances}
        for lt in LeaveType:
            if lt not in present:
                balances.append(LeaveBalanceItem(leave_type=lt, balance_days=Decimal("0")))
        balances.sort(key=lambda b: b.leave_type.value)
        return LeaveBalanceResponse(employment_id=employment_id, balances=balances)

    async def _load_holidays(
        self,
        *,
        calendar_id: int | None = None,
        year: int | None = None,
    ) -> list[HolidayItem]:
        from app.modules.admin.holiday_calendar.service import HolidayCalendarService

        org = HolidayCalendarService(self._session)
        items: list[HolidayItem] = []
        if calendar_id is not None:
            rows = await org.list_holidays(calendar_id)
            for h in rows:
                if year is not None and h.date.year != year:
                    continue
                items.append(
                    HolidayItem(
                        date=h.date,
                        name=h.name,
                        holiday_type=h.holiday_type or "",
                    )
                )
            return items

        calendars = await org.list(include_archived=False)
        for cal in calendars:
            rows = await org.list_holidays(cal.id)
            for h in rows:
                if year is not None and h.date.year != year:
                    continue
                items.append(
                    HolidayItem(
                        date=h.date,
                        name=h.name,
                        holiday_type=h.holiday_type or "",
                    )
                )
        seen: set[date] = set()
        unique: list[HolidayItem] = []
        for h in sorted(items, key=lambda x: x.date):
            if h.date in seen:
                continue
            seen.add(h.date)
            unique.append(h)
        return unique

    async def get_apply_context(
        self,
        employment_id: int,
        *,
        holiday_calendar_id: int | None = None,
        year: int | None = None,
    ) -> ApplyLeaveContextResponse:
        as_of = date.today()
        y = year or as_of.year
        holidays = await self._load_holidays(calendar_id=holiday_calendar_id, year=y)

        leave_types: list[LeaveTypeOptionItem] = []
        for lt in LeaveType:
            try:
                policy = await self._policy.get_current_policy(lt, as_of=as_of)
                leave_types.append(
                    LeaveTypeOptionItem(
                        leave_type=lt,
                        name=policy.name,
                        annual_entitlement=policy.annual_entitlement,
                        description=None,
                    )
                )
            except NotFoundError:
                leave_types.append(
                    LeaveTypeOptionItem(
                        leave_type=lt,
                        name=leave_type_label(lt),
                        annual_entitlement=Decimal("0"),
                        description=None,
                    )
                )

        balance_resp = await self.get_balances(employment_id)
        balances: list[ApplyLeaveBalanceItem] = []
        entitlement_by_type = {t.leave_type: t.annual_entitlement for t in leave_types}
        for b in balance_resp.balances:
            total = entitlement_by_type.get(b.leave_type, Decimal("0"))
            remaining = b.balance_days
            used = max(Decimal("0"), total - remaining) if total > 0 else Decimal("0")
            balances.append(
                ApplyLeaveBalanceItem(
                    leave_type=b.leave_type,
                    used=used,
                    total=total,
                    remaining=remaining,
                )
            )

        return ApplyLeaveContextResponse(
            employment_id=employment_id,
            holidays=holidays,
            leave_types=leave_types,
            balances=balances,
        )

    async def calculate_leave_days(
        self, data: LeaveCalculateRequest
    ) -> LeaveCalculateResponse:
        holidays = await self._load_holidays(calendar_id=data.holiday_calendar_id)
        holiday_dates = {h.date for h in holidays}
        in_range = [h for h in holidays if data.start_date <= h.date <= data.end_date]
        day_cost = _working_days(
            data.start_date,
            data.end_date,
            holiday_dates=holiday_dates,
            half_day=data.half_day,
        )

        balance_remaining: Decimal | None = None
        estimated_after: Decimal | None = None
        if data.leave_type != LeaveType.LOSS_OF_PAY:
            balance_remaining = await self._repo.sum_balance(
                data.employment_id, data.leave_type
            )
            estimated_after = max(Decimal("0"), balance_remaining - day_cost)

        return LeaveCalculateResponse(
            day_cost=day_cost,
            balance_remaining=balance_remaining,
            estimated_balance_after=estimated_after,
            holidays_in_range=in_range,
        )
