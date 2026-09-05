"""
PayrollPublicService — only public entry for Payroll.

V1 flow:
  configure salary → calculate monthly → approve → mark paid
  On PAID → lock monthly attendance summary for that employee/month.
"""

from __future__ import annotations

import logging
from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import PayrollItemType, PayrollStatus, SalaryItemType
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.payroll.models import (
    EmployeeBankAccount,
    EmployeeSalary,
    EmployeeSalaryItem,
    MonthlyPayroll,
    MonthlyPayrollItem,
)
from app.modules.payroll.repositories.repository import PayrollRepository
from app.modules.payroll.schemas.schemas import (
    BankAccountCreate,
    BankAccountResponse,
    EmployeeSalaryCreate,
    EmployeeSalaryItemResponse,
    EmployeeSalaryResponse,
    MessageResponse,
    MonthlyPayrollItemResponse,
    MonthlyPayrollResponse,
    PayrollCalculateRequest,
    PayrollPaymentRequest,
)

logger = logging.getLogger(__name__)


def _salary_response(s: EmployeeSalary) -> EmployeeSalaryResponse:
    return EmployeeSalaryResponse(
        id=s.id,
        employment_id=s.employment_id,
        effective_from=s.effective_from,
        effective_to=s.effective_to,
        gross_salary=s.gross_salary,
        created_at=s.created_at,
        updated_at=s.updated_at,
        changed_by=s.changed_by,
        items=[EmployeeSalaryItemResponse.model_validate(i) for i in (s.items or [])],
    )


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
        items=[
            MonthlyPayrollItemResponse.model_validate(i) for i in (p.items or [])
        ],
    )


class PayrollPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = PayrollRepository(session)

    # ==================================================================
    # Salary configuration (versioned)
    # ==================================================================

    async def create_salary(
        self,
        data: EmployeeSalaryCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> EmployeeSalaryResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        current = await self._repo.get_current_salary(
            data.employment_id, as_of=data.effective_from
        )
        if current and current.effective_to is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_salary(current.id, close_to)

        salary = EmployeeSalary(
            employment_id=data.employment_id,
            effective_from=data.effective_from,
            effective_to=None,
            gross_salary=data.gross_salary,
            changed_by=actor,
        )
        await self._repo.add(salary)
        await self._flush()

        for item in data.items:
            await self._repo.add(
                EmployeeSalaryItem(
                    employee_salary_id=salary.id,
                    name=item.name,
                    type=item.type,
                    amount=item.amount,
                    changed_by=actor,
                )
            )

        await self._commit()
        salary = await self._repo.get_salary_by_id(salary.id, with_items=True)
        await self._audit("employee_salary.created", salary.id, actor)
        return _salary_response(salary)

    async def get_current_salary(
        self, employment_id: int, *, as_of: Optional[date] = None
    ) -> EmployeeSalaryResponse:
        salary = await self._repo.get_current_salary(employment_id, as_of=as_of)
        if salary is None:
            raise NotFoundError("No effective salary configuration")
        return _salary_response(salary)

    async def list_salaries(self, employment_id: int) -> list[EmployeeSalaryResponse]:
        rows = await self._repo.list_salaries(employment_id)
        return [_salary_response(r) for r in rows]

    # ==================================================================
    # Calculate monthly payroll
    # ==================================================================

    async def calculate_payroll(
        self,
        data: PayrollCalculateRequest,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MonthlyPayrollResponse:
        existing = await self._repo.get_payroll(
            data.employment_id, data.year, data.month
        )
        if existing and existing.status == PayrollStatus.PAID:
            raise DomainError("Payroll already PAID; cannot recalculate")
        if existing and existing.status == PayrollStatus.APPROVED:
            raise DomainError("Payroll is APPROVED; reject/reset before recalculating")

        # Salary as of month end
        last_day = monthrange(data.year, data.month)[1]
        as_of = date(data.year, data.month, last_day)
        salary = await self._repo.get_current_salary(data.employment_id, as_of=as_of)
        if salary is None:
            raise NotFoundError("No salary configuration effective for this period")

        # Attendance summary (optional — LOP if available)
        payable_days, lop_days = await self._attendance_metrics(
            data.employment_id, data.year, data.month
        )

        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        items: list[MonthlyPayrollItem] = []

        # Copy salary items → payroll items
        for si in salary.items or []:
            ptype = (
                PayrollItemType.EARNING
                if si.type == SalaryItemType.EARNING
                else PayrollItemType.DEDUCTION
            )
            amount = si.amount
            # Pro-rate earnings on LOP (simple V1: daily rate * lop)
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

        # Explicit LOP deduction line if pro-rate not applied to each earning
        # (kept informational when we already pro-rated)

        # Adjustments
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
            # Replace items
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
        await self._audit("payroll.calculated", payroll.id, actor)
        return _payroll_response(payroll)

    async def _attendance_metrics(
        self, employment_id: int, year: int, month: int
    ) -> tuple[Optional[Decimal], Optional[Decimal]]:
        try:
            from app.modules.attendance.services.public_service import (
                AttendancePublicService,
            )

            att = AttendancePublicService(self._session)
            try:
                summary = await att.get_monthly_summary(employment_id, year, month)
            except NotFoundError:
                # Attempt rebuild
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

    # ==================================================================
    # Approve / Pay
    # ==================================================================

    async def approve_payroll(
        self,
        payroll_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MonthlyPayrollResponse:
        payroll = await self._repo.get_payroll_by_id(payroll_id, with_items=True)
        if payroll is None:
            raise NotFoundError("Payroll not found")
        if payroll.status != PayrollStatus.CALCULATED:
            raise DomainError("Only CALCULATED payroll can be approved")
        payroll.status = PayrollStatus.APPROVED
        payroll.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("payroll.approved", payroll.id, actor_employment_id)
        return _payroll_response(payroll)

    async def mark_paid(
        self,
        payroll_id: int,
        data: PayrollPaymentRequest,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MonthlyPayrollResponse:
        payroll = await self._repo.get_payroll_by_id(payroll_id, with_items=True)
        if payroll is None:
            raise NotFoundError("Payroll not found")
        if payroll.status != PayrollStatus.APPROVED:
            raise DomainError("Only APPROVED payroll can be marked PAID")

        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        payroll.status = PayrollStatus.PAID
        payroll.payment_method = data.payment_method
        payroll.payment_reference = data.payment_reference
        payroll.payment_date = data.payment_date or date.today()
        payroll.changed_by = actor
        await self._commit()
        await self._audit("payroll.paid", payroll.id, actor)

        # Lock attendance summary for the month
        try:
            from app.modules.attendance.services.public_service import (
                AttendancePublicService,
            )

            att = AttendancePublicService(self._session)
            await att.lock_monthly_summary(
                payroll.employment_id,
                payroll.year,
                payroll.month,
                actor_employment_id=actor,
            )
        except Exception:
            logger.exception(
                "Failed to lock attendance summary after payroll PAID id=%s",
                payroll.id,
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
        employment_id: Optional[int] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
        limit: int = 100,
    ) -> list[MonthlyPayrollResponse]:
        rows = await self._repo.list_payrolls(
            employment_id=employment_id, year=year, month=month, limit=limit
        )
        return [_payroll_response(r) for r in rows]

    # ==================================================================
    # Bank accounts
    # ==================================================================

    async def add_bank_account(
        self,
        data: BankAccountCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> BankAccountResponse:
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        if data.is_primary:
            await self._repo.clear_primary(data.employment_id)
        acc = EmployeeBankAccount(
            employment_id=data.employment_id,
            account_holder_name=data.account_holder_name,
            bank_name=data.bank_name,
            account_number=data.account_number,
            ifsc_code=data.ifsc_code,
            account_type=data.account_type,
            is_primary=data.is_primary,
            is_active=True,
            changed_by=actor,
        )
        await self._repo.add(acc)
        await self._commit()
        return BankAccountResponse.model_validate(acc)

    async def list_bank_accounts(
        self, employment_id: int
    ) -> list[BankAccountResponse]:
        rows = await self._repo.list_bank_accounts(employment_id)
        return [BankAccountResponse.model_validate(r) for r in rows]

    async def get_primary_bank(
        self, employment_id: int
    ) -> BankAccountResponse:
        acc = await self._repo.get_primary_bank(employment_id)
        if acc is None:
            raise NotFoundError("No primary bank account")
        return BankAccountResponse.model_validate(acc)

    # ==================================================================
    # Helpers
    # ==================================================================

