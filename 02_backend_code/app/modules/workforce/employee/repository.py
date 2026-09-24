"""Employee / employment / position repository."""
from __future__ import annotations

from collections.abc import Sequence
from datetime import date
from typing import TYPE_CHECKING, Optional

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

if TYPE_CHECKING:
    from app.modules.rbac.scoping.constraint import ScopeConstraint


class EmployeeRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_position_by_id(
        self, position_id: int, *, include_archived: bool = False
    ) -> Position | None:
        stmt = select(Position).where(Position.id == position_id)
        if not include_archived:
            stmt = stmt.where(Position.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def get_position_by_name(self, name: str) -> Position | None:
        stmt = select(Position).where(
            Position.name == name, Position.is_archived.is_(False)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_positions(
        self, *, include_archived: bool = False, department_id: int | None = None
    ) -> Sequence[Position]:
        stmt = select(Position).order_by(Position.name)
        if not include_archived:
            stmt = stmt.where(Position.is_archived.is_(False))
        if department_id is not None:
            stmt = stmt.where(
                (Position.department_id == department_id)
                | (Position.department_id.is_(None))
            )
        return await self.scalars(stmt)

    async def get_employment_by_id(
        self,
        employment_id: int,
        *,
        with_relations: bool = False,
        constraint: Optional["ScopeConstraint"] = None,
    ) -> Employment | None:
        """Fetch by id AND optional scope filter (never fetch-then-check)."""
        from app.modules.rbac.scoping.adapters import apply_scope

        stmt = select(Employment).where(Employment.id == employment_id)
        if constraint is not None:
            stmt = apply_scope(stmt, constraint)
        if with_relations:
            stmt = stmt.options(
                selectinload(Employment.state_history),
                selectinload(Employment.assignments),
            )
        return await self.scalar_one_or_none(stmt)

    async def get_employment_by_code(self, employee_code: str) -> Employment | None:
        stmt = select(Employment).where(Employment.employee_code == employee_code)
        return await self.scalar_one_or_none(stmt)

    async def list_employments_by_person(self, person_id: int) -> Sequence[Employment]:
        stmt = (
            select(Employment)
            .where(Employment.person_id == person_id)
            .order_by(Employment.joining_date.desc())
        )
        return await self.scalars(stmt)

    async def list_employments(
        self,
        *,
        state: str | None = None,
        limit: int = 100,
        offset: int = 0,
        constraint: Optional["ScopeConstraint"] = None,
    ) -> Sequence[Employment]:
        """List with optional ScopeConstraint applied BEFORE limit/offset."""
        from app.modules.rbac.scoping.adapters import apply_scope

        stmt = select(Employment).order_by(Employment.employee_code)
        if state is not None:
            stmt = stmt.where(Employment.current_state == state)
        if constraint is not None:
            stmt = apply_scope(stmt, constraint)
        stmt = stmt.limit(limit).offset(offset)
        return await self.scalars(stmt)

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

    async def get_current_assignment(
        self, employment_id: int, *, as_of: date | None = None
    ) -> EmploymentAssignment | None:
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

    async def list_assignments(self, employment_id: int) -> Sequence[EmploymentAssignment]:
        stmt = (
            select(EmploymentAssignment)
            .where(EmploymentAssignment.employment_id == employment_id)
            .order_by(EmploymentAssignment.effective_from.desc())
        )
        return await self.scalars(stmt)

    async def close_assignment(self, assignment_id: int, effective_to: date) -> None:
        stmt = (
            update(EmploymentAssignment)
            .where(EmploymentAssignment.id == assignment_id)
            .values(effective_to=effective_to)
        )
        await self.execute(stmt)

    async def list_covering_assignments(
        self, employment_id: int, effective_from: date
    ) -> Sequence[EmploymentAssignment]:
        stmt = (
            select(EmploymentAssignment)
            .where(
                EmploymentAssignment.employment_id == employment_id,
                EmploymentAssignment.effective_from <= effective_from,
                (EmploymentAssignment.effective_to.is_(None))
                | (EmploymentAssignment.effective_to >= effective_from),
            )
            .order_by(EmploymentAssignment.effective_from.desc())
        )
        return await self.scalars(stmt)

    async def has_future_assignments(
        self, employment_id: int, *, as_of: date
    ) -> bool:
        stmt = select(EmploymentAssignment).where(
            EmploymentAssignment.employment_id == employment_id,
            EmploymentAssignment.effective_from > as_of,
        )
        return await self.scalar_one_or_none(stmt) is not None


EmploymentRepository = EmployeeRepository
