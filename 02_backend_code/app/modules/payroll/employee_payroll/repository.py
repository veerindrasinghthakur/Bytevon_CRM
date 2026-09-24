"""Employee payroll bank repository."""
from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.payroll.models import EmployeeBankAccount


class EmployeePayrollRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_primary_bank(
        self, employment_id: int
    ) -> EmployeeBankAccount | None:
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
