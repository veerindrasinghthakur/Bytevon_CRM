"""Monthly payroll repository."""
from __future__ import annotations

from collections.abc import Sequence
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repositories.base_repository import BaseRepository
from app.modules.payroll.models import EmployeeSalary, MonthlyPayroll


class MonthlyPayrollRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_current_salary(
        self, employment_id: int, *, as_of: date | None = None
    ) -> EmployeeSalary | None:
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

    async def get_payroll(
        self, employment_id: int, year: int, month: int, *, with_items: bool = False
    ) -> MonthlyPayroll | None:
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
    ) -> MonthlyPayroll | None:
        stmt = select(MonthlyPayroll).where(MonthlyPayroll.id == payroll_id)
        if with_items:
            stmt = stmt.options(selectinload(MonthlyPayroll.items))
        return await self.scalar_one_or_none(stmt)

    async def list_payrolls(
        self,
        *,
        employment_id: int | None = None,
        year: int | None = None,
        month: int | None = None,
        limit: int = 100,
        with_items: bool = False,
    ) -> Sequence[MonthlyPayroll]:
        stmt = select(MonthlyPayroll).order_by(
            MonthlyPayroll.year.desc(), MonthlyPayroll.month.desc()
        )
        if with_items:
            stmt = stmt.options(selectinload(MonthlyPayroll.items))
        if employment_id is not None:
            stmt = stmt.where(MonthlyPayroll.employment_id == employment_id)
        if year is not None:
            stmt = stmt.where(MonthlyPayroll.year == year)
        if month is not None:
            stmt = stmt.where(MonthlyPayroll.month == month)
        stmt = stmt.limit(limit)
        return await self.scalars(stmt)
