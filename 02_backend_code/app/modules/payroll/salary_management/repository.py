"""Salary repository."""
from __future__ import annotations

from collections.abc import Sequence
from datetime import date

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repositories.base_repository import BaseRepository
from app.modules.payroll.models import EmployeeSalary


class SalaryRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_salary_by_id(
        self, salary_id: int, *, with_items: bool = False
    ) -> EmployeeSalary | None:
        stmt = select(EmployeeSalary).where(EmployeeSalary.id == salary_id)
        if with_items:
            stmt = stmt.options(selectinload(EmployeeSalary.items))
        return await self.scalar_one_or_none(stmt)

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

    async def list_salaries(self, employment_id: int) -> Sequence[EmployeeSalary]:
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

    async def employment_ids_with_open_salary(self) -> set[int]:
        stmt = select(EmployeeSalary.employment_id).where(
            EmployeeSalary.effective_to.is_(None)
        )
        return {int(eid) for eid in await self.scalars(stmt)}
