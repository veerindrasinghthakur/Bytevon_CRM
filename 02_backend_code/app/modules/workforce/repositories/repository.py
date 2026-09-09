"""
EmploymentRepository — domain-specific queries only.
"""

from __future__ import annotations

from datetime import date
from typing import Optional, Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repositories.base_repository import BaseRepository
from app.modules.workforce.models import (
    Employment,
    EmploymentAssignment,
    EmploymentStateHistory,
    Position,
)


class EmploymentRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Position
    # ------------------------------------------------------------------

    async def get_position_by_id(
        self, position_id: int, *, include_archived: bool = False
    ) -> Optional[Position]:
        stmt = select(Position).where(Position.id == position_id)
        if not include_archived:
            stmt = stmt.where(Position.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def get_position_by_name(self, name: str) -> Optional[Position]:
        stmt = select(Position).where(
            Position.name == name, Position.is_archived.is_(False)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_positions(
        self, *, include_archived: bool = False
    ) -> Sequence[Position]:
        stmt = select(Position).order_by(Position.name)
        if not include_archived:
            stmt = stmt.where(Position.is_archived.is_(False))
        return await self.scalars(stmt)

    # ------------------------------------------------------------------
    # Employment
    # ------------------------------------------------------------------

    async def get_employment_by_id(
        self, employment_id: int, *, with_relations: bool = False
    ) -> Optional[Employment]:
        stmt = select(Employment).where(Employment.id == employment_id)
        if with_relations:
            stmt = stmt.options(
                selectinload(Employment.state_history),
                selectinload(Employment.assignments),
            )
        return await self.scalar_one_or_none(stmt)

    async def get_employment_by_code(self, employee_code: str) -> Optional[Employment]:
        stmt = select(Employment).where(Employment.employee_code == employee_code)
        return await self.scalar_one_or_none(stmt)

    async def list_employments_by_person(
        self, person_id: int
    ) -> Sequence[Employment]:
        stmt = (
            select(Employment)
            .where(Employment.person_id == person_id)
            .order_by(Employment.joining_date.desc())
        )
        return await self.scalars(stmt)

    async def list_employments(
        self,
        *,
        state: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Employment]:
        stmt = select(Employment).order_by(Employment.employee_code)
        if state is not None:
            stmt = stmt.where(Employment.current_state == state)
        stmt = stmt.limit(limit).offset(offset)
        return await self.scalars(stmt)

    # ------------------------------------------------------------------
    # State history
    # ------------------------------------------------------------------

    async def list_state_history(
        self, employment_id: int, *, limit: int = 50
    ) -> Sequence[EmploymentStateHistory]:
        stmt = (
            select(EmploymentStateHistory)
            .where(EmploymentStateHistory.employment_id == employment_id)
            .order_by(
                EmploymentStateHistory.effective_date.desc(),
                EmploymentStateHistory.id.desc(),
            )
            .limit(limit)
        )
        return await self.scalars(stmt)

    async def get_latest_state_history(
        self, employment_id: int
    ) -> Optional[EmploymentStateHistory]:
        stmt = (
            select(EmploymentStateHistory)
            .where(EmploymentStateHistory.employment_id == employment_id)
            .order_by(
                EmploymentStateHistory.effective_date.desc(),
                EmploymentStateHistory.id.desc(),
            )
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    # ------------------------------------------------------------------
    # Assignments
    # ------------------------------------------------------------------

    async def get_current_assignment(
        self, employment_id: int, *, as_of: Optional[date] = None
    ) -> Optional[EmploymentAssignment]:
        as_of = as_of or date.today()
        stmt = (
            select(EmploymentAssignment)
            .where(
                EmploymentAssignment.employment_id == employment_id,
                EmploymentAssignment.effective_from <= as_of,
                (EmploymentAssignment.effective_to.is_(None))
                | (EmploymentAssignment.effective_to >= as_of),
            )
            .order_by(EmploymentAssignment.effective_from.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_assignments(
        self, employment_id: int
    ) -> Sequence[EmploymentAssignment]:
        stmt = (
            select(EmploymentAssignment)
            .where(EmploymentAssignment.employment_id == employment_id)
            .order_by(EmploymentAssignment.effective_from.desc())
        )
        return await self.scalars(stmt)

    async def close_assignment(
        self, assignment_id: int, effective_to: date
    ) -> None:
        stmt = (
            update(EmploymentAssignment)
            .where(EmploymentAssignment.id == assignment_id)
            .values(effective_to=effective_to)
        )
        await self.execute(stmt)
