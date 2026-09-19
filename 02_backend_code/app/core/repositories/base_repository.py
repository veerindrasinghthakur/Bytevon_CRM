"""
BaseRepository — generic SQLAlchemy helpers only.

No business logic. No generic CRUD (get_by_id, list, etc.).
Each module repository implements the exact queries it needs.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, TypeVar

from sqlalchemy import Result, Select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

ModelT = TypeVar("ModelT", bound=DeclarativeBase)


class BaseRepository:
    """
    Shared low-level helpers for all module repositories.
    Repositories never call commit() / rollback().
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, instance: ModelT) -> ModelT:
        self._session.add(instance)
        return instance

    async def add_all(self, instances: Sequence[ModelT]) -> Sequence[ModelT]:
        self._session.add_all(instances)
        return instances

    async def delete(self, instance: DeclarativeBase) -> None:
        """
        Hard delete. Prefer archive in almost all cases.
        Only use when the domain explicitly allows hard delete.
        """
        await self._session.delete(instance)

    async def flush(self) -> None:
        await self._session.flush()

    async def refresh(self, instance: ModelT) -> ModelT:
        await self._session.refresh(instance)
        return instance

    async def execute(self, statement: Select[Any] | Any) -> Result[Any]:
        return await self._session.execute(statement)

    async def scalar(self, statement: Select[Any] | Any) -> Any:
        result = await self._session.execute(statement)
        return result.scalar()

    async def scalars(self, statement: Select[Any] | Any) -> Sequence[Any]:
        result = await self._session.execute(statement)
        return result.scalars().all()

    async def scalar_one_or_none(self, statement: Select[Any] | Any) -> Any:
        result = await self._session.execute(statement)
        return result.scalar_one_or_none()
