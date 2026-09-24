"""MonthlyPayrollService — calculate / list / get / approve / pay."""
from __future__ import annotations

import logging
from calendar import monthrange
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import PayrollItemType, PayrollStatus, SalaryItemType
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.payroll.models import MonthlyPayroll, MonthlyPayrollItem
from app.modules.payroll.monthly_payroll.repository import MonthlyPayrollRepository
from app.modules.payroll.monthly_payroll.schemas import (
    MonthlyPayrollItemResponse,
    MonthlyPayrollResponse,
    PayrollCalculateRequest,
    PayrollPaymentRequest,
)

logger = logging.getLogger(__name__)


def _payroll_response(p: MonthlyPayroll) -> MonthlyPayrollResponse:
    return MonthlyPayrollResponse(
        id=p.id,
        employment_id=p.employment_id,
        year=p.year,
        month=p.month,
        gross_salary=p.gross_salary,
        total_earnings=p.total_earnings,
        total_deductions=p.total_deductions,
        net_salary=p.net_salary,
        status=p.status,
        payment_method=p.payment_method,
        payment_reference=p.payment_reference,
        payment_date=p.payment_date,
        payable_days=p.payable_days,
        lop_days=p.lop_days,
        created_at=p.created_at,
        updated_at=p.updated_at,
        changed_by=p.changed_by,
        items=[MonthlyPayrollItemResponse.model_validate(i) for i in (p.items or [])],
    )


class MonthlyPayrollService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MonthlyPayrollRepository(session)

    async def calculate_payroll(
        self,
        data: PayrollCalculateRequest,
        *,
        actor_employment_id: int | None = None,
    ) -> MonthlyPayrollResponse:
        existing = await self._repo.get_payroll(
            data.employment_id, data.year, data.month, with_items=True
        )
        if existing and existing.status == PayrollStatus.PAID:
            raise DomainError("Payroll already PAID; PAID is terminal and immutable")
        if existing and existing.status == PayrollStatus.APPROVED:
            raise DomainError(
                "Payroll is APPROVED; reject it (POST /payroll/{id}/reject) "
                "before recalculating"
            )

        last_day = monthrange(data.year, data.month)[1]
        as_of = date(data.year, data.month, last_day)
        salary = await self._repo.get_current_salary(data.employment_id, as_of=as_of)
        if salary is None:
            raise NotFoundError("No salary configuration effective for this period")

        payable_days, lop_days = await self._attendance_metrics(
            data.employment_id, data.year, data.month
        )
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        items: list[MonthlyPayrollItem] = []

        for si in salary.items or []:
            ptype = (
                PayrollItemType.EARNING
                if si.type == SalaryItemType.EARNING
                else PayrollItemType.DEDUCTION
            )
            amount = si.amount
            if (
                ptype == PayrollItemType.EARNING
                and lop_days
                and lop_days > 0
                and payable_days is not None
                and (payable_days + lop_days) > 0
            ):
                total_days = payable_days + lop_days
                daily = si.amount / total_days
                amount = (si.amount - daily * lop_days).quantize(Decimal("0.01"))
            items.append(
                MonthlyPayrollItem(
                    name=si.name,
                    type=ptype,
                    amount=amount,
                    description="From salary configuration",
                )
            )

        for adj in data.adjustments:
            items.append(
                MonthlyPayrollItem(
                    name=adj.name,
                    type=PayrollItemType.ADJUSTMENT,
                    amount=adj.amount
                    if adj.type == SalaryItemType.EARNING
                    else -abs(adj.amount),
                    description="Manual adjustment",
                )
            )

        total_earnings = sum(
            (i.amount for i in items if i.type == PayrollItemType.EARNING),
            Decimal("0"),
        )
        total_deductions = sum(
            (i.amount for i in items if i.type == PayrollItemType.DEDUCTION),
            Decimal("0"),
        )
        adjustments = sum(
            (i.amount for i in items if i.type == PayrollItemType.ADJUSTMENT),
            Decimal("0"),
        )
        net = total_earnings + adjustments - total_deductions

        if existing:
            for old in list(existing.items or []):
                await self._session.delete(old)
            existing.gross_salary = salary.gross_salary
            existing.total_earnings = total_earnings
            existing.total_deductions = total_deductions
            existing.net_salary = net
            existing.status = PayrollStatus.CALCULATED
            existing.payable_days = payable_days
            existing.lop_days = lop_days
            existing.changed_by = actor
            payroll = existing
            await self._flush()
            for it in items:
                it.monthly_payroll_id = payroll.id
                await self._repo.add(it)
        else:
            payroll = MonthlyPayroll(
                employment_id=data.employment_id,
                year=data.year,
                month=data.month,
                gross_salary=salary.gross_salary,
                total_earnings=total_earnings,
                total_deductions=total_deductions,
                net_salary=net,
                status=PayrollStatus.CALCULATED,
                payable_days=payable_days,
                lop_days=lop_days,
                changed_by=actor,
            )
            await self._repo.add(payroll)
            await self._flush()
            for it in items:
                it.monthly_payroll_id = payroll.id
                await self._repo.add(it)

        await self._commit()
        payroll = await self._repo.get_payroll_by_id(payroll.id, with_items=True)
        if payroll is None:
            raise NotFoundError("Payroll run not found after calculate")
        await self._audit("payroll.calculated", payroll.id, actor)
        return _payroll_response(payroll)

    async def _attendance_metrics(
        self, employment_id: int, year: int, month: int
    ) -> tuple[Decimal | None, Decimal | None]:
        try:
            from app.modules.workforce.attendance.service import AttendanceService

            att = AttendanceService(self._session)
            try:
                summary = await att.get_monthly_summary(employment_id, year, month)
            except NotFoundError:
                summary = await att.rebuild_monthly_summary(
                    employment_id, year, month, actor_employment_id=None
                )
            payable = summary.present_days + summary.on_leave_days + summary.half_days
            lop = summary.absent_days
            return payable, lop
        except Exception:
            logger.exception(
                "Could not load attendance metrics for %s %s-%s",
                employment_id,
                year,
                month,
            )
            return None, None

    async def approve_payroll(
        self, payroll_id: int, *, actor_employment_id: int | None = None
    ) -> MonthlyPayrollResponse:
        payroll = await self._repo.get_payroll_by_id(payroll_id, with_items=True)
        if payroll is None:
            raise NotFoundError("Payroll not found")
        if payroll.status != PayrollStatus.CALCULATED:
            raise DomainError("Only CALCULATED payroll can be approved")
        payroll.status = PayrollStatus.APPROVED
        payroll.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._session.refresh(payroll)
        await self._audit("payroll.approved", payroll.id, actor_employment_id)
        return _payroll_response(payroll)

    async def reject_payroll(
        self,
        payroll_id: int,
        *,
        reason: str,
        actor_employment_id: int | None = None,
    ) -> MonthlyPayrollResponse:
        """Q4: APPROVED → CALCULATED reject/reset with reason + audit.

        PAID is terminal and can never transition back.
        """
        payroll = await self._repo.get_payroll_by_id(payroll_id, with_items=True)
        if payroll is None:
            raise NotFoundError("Payroll not found")
        if payroll.status == PayrollStatus.PAID:
            raise DomainError("PAID payroll is terminal and cannot be rejected")
        if payroll.status != PayrollStatus.APPROVED:
            raise DomainError("Only APPROVED payroll can be rejected")
        if not (reason or "").strip():
            raise DomainError("A rejection reason is required")
        payroll.status = PayrollStatus.CALCULATED
        payroll.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._session.refresh(payroll)
        await self._audit(
            "payroll.rejected",
            payroll.id,
            actor_employment_id,
            description=f"Payroll rejected: {reason.strip()}",
        )
        return _payroll_response(payroll)

    async def mark_paid(
        self,
        payroll_id: int,
        data: PayrollPaymentRequest,
        *,
        actor_employment_id: int | None = None,
    ) -> MonthlyPayrollResponse:
        payroll = await self._repo.get_payroll_by_id(payroll_id, with_items=True)
        if payroll is None:
            raise NotFoundError("Payroll not found")
        if payroll.status != PayrollStatus.APPROVED:
            raise DomainError("Only APPROVED payroll can be marked PAID")
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        # Q8: PAID must guarantee the attendance month is locked. Lock first;
        # if locking fails the payment fails (no swallowed exception).
        from app.modules.workforce.attendance.service import AttendanceService

        att = AttendanceService(self._session)
        try:
            await att.lock_monthly_summary(
                payroll.employment_id,
                payroll.year,
                payroll.month,
                actor_employment_id=actor,
            )
        except NotFoundError:
            # No summary exists for this month (e.g. no attendance days):
            # nothing to lock; payment may proceed.
            pass
        except DomainError:
            raise
        except Exception as exc:
            logger.exception(
                "Failed to lock attendance summary before payroll PAID id=%s",
                payroll.id,
            )
            raise DomainError(
                "Cannot mark payroll PAID: attendance month could not be locked"
            ) from exc
        payroll.status = PayrollStatus.PAID
        payroll.payment_method = data.payment_method
        payroll.payment_reference = data.payment_reference
        payroll.payment_date = data.payment_date or date.today()
        payroll.changed_by = actor
        await self._commit()
        await self._session.refresh(payroll)
        await self._audit("payroll.paid", payroll.id, actor)
        await self._notify(
            employment_id=payroll.employment_id,
            title="Payroll paid",
            body=(
                f"Payroll for {payroll.year}-{payroll.month:02d} has been marked "
                f"PAID (net {payroll.net_salary})."
            ),
        )
        return _payroll_response(payroll)

    async def get_payroll(self, payroll_id: int) -> MonthlyPayrollResponse:
        payroll = await self._repo.get_payroll_by_id(payroll_id, with_items=True)
        if payroll is None:
            raise NotFoundError("Payroll not found")
        return _payroll_response(payroll)

    async def list_payrolls(
        self,
        *,
        employment_id: int | None = None,
        year: int | None = None,
        month: int | None = None,
        limit: int = 100,
    ) -> list[MonthlyPayrollResponse]:
        rows = await self._repo.list_payrolls(
            employment_id=employment_id, year=year, month=month, limit=limit,
            with_items=True,
        )
        return [_payroll_response(r) for r in rows]
