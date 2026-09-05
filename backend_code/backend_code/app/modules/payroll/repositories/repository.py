"""
PayrollRepository — domain-specific queries only.
"""

from __future__ import annotations

from datetime import date
from typing import Optional, Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repositories.base_repository import BaseRepository
from app.modules.payroll.models import (
    EmployeeBankAccount,
    EmployeeSalary,
    MonthlyPayroll,
)


class PayrollRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # Salary
    async def get_salary_by_id(
        self, salary_id: int, *, with_items: bool = False
    ) -> Optional[EmployeeSalary]:
        stmt = select(EmployeeSalary).where(EmployeeSalary.id == salary_id)
        if with_items:
            stmt = stmt.options(selectinload(EmployeeSalary.items))
        return await self.scalar_one_or_none(stmt)

    async def get_current_salary(
        self, employment_id: int, *, as_of: Optional[date] = None
    ) -> Optional[EmployeeSalary]:
        as_of = as_of or date.today()
        stmt = (
            select(EmployeeSalary)
            .options(selectinload(EmployeeSalary.items))
            .where(
                EmployeeSalary.employment_id == employment_id,
                EmployeeSalary.effective_from <= as_of,
                (EmployeeSalary.effective_to.is_(None))
                | (EmployeeSalary.effective_to >= as_of),
            )
            .order_by(EmployeeSalary.effective_from.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_salaries(
        self, employment_id: int
    ) -> Sequence[EmployeeSalary]:
        stmt = (
            select(EmployeeSalary)
            .options(selectinload(EmployeeSalary.items))
            .where(EmployeeSalary.employment_id == employment_id)
            .order_by(EmployeeSalary.effective_from.desc())
        )
        return await self.scalars(stmt)

    async def close_salary(self, salary_id: int, effective_to: date) -> None:
        stmt = (
            update(EmployeeSalary)
            .where(EmployeeSalary.id == salary_id)
            .values(effective_to=effective_to)
        )
        await self.execute(stmt)

    # Monthly payroll
    async def get_payroll(
        self, employment_id: int, year: int, month: int, *, with_items: bool = False
    ) -> Optional[MonthlyPayroll]:
        stmt = select(MonthlyPayroll).where(
            MonthlyPayroll.employment_id == employment_id,
            MonthlyPayroll.year == year,
            MonthlyPayroll.month == month,
        )
        if with_items:
            stmt = stmt.options(selectinload(MonthlyPayroll.items))
        return await self.scalar_one_or_none(stmt)

    async def get_payroll_by_id(
        self, payroll_id: int, *, with_items: bool = False
    ) -> Optional[MonthlyPayroll]:
        stmt = select(MonthlyPayroll).where(MonthlyPayroll.id == payroll_id)
        if with_items:
            stmt = stmt.options(selectinload(MonthlyPayroll.items))
        return await self.scalar_one_or_none(stmt)

    async def list_payrolls(
        self,
        *,
        employment_id: Optional[int] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
        limit: int = 100,
    ) -> Sequence[MonthlyPayroll]:
        stmt = select(MonthlyPayroll).order_by(
            MonthlyPayroll.year.desc(), MonthlyPayroll.month.desc()
        )
        if employment_id is not None:
            stmt = stmt.where(MonthlyPayroll.employment_id == employment_id)
        if year is not None:
            stmt = stmt.where(MonthlyPayroll.year == year)
        if month is not None:
            stmt = stmt.where(MonthlyPayroll.month == month)
        stmt = stmt.limit(limit)
        return await self.scalars(stmt)

    # Bank
    async def get_primary_bank(
        self, employment_id: int
    ) -> Optional[EmployeeBankAccount]:
        stmt = select(EmployeeBankAccount).where(
            EmployeeBankAccount.employment_id == employment_id,
            EmployeeBankAccount.is_primary.is_(True),
            EmployeeBankAccount.is_active.is_(True),
        )
        return await self.scalar_one_or_none(stmt)

    async def list_bank_accounts(
        self, employment_id: int
    ) -> Sequence[EmployeeBankAccount]:
        stmt = (
            select(EmployeeBankAccount)
            .where(EmployeeBankAccount.employment_id == employment_id)
            .order_by(EmployeeBankAccount.created_at.desc())
        )
        return await self.scalars(stmt)

    async def clear_primary(self, employment_id: int) -> None:
        stmt = (
            update(EmployeeBankAccount)
            .where(
                EmployeeBankAccount.employment_id == employment_id,
                EmployeeBankAccount.is_primary.is_(True),
            )
            .values(is_primary=False)
        )
        await self.execute(stmt)
