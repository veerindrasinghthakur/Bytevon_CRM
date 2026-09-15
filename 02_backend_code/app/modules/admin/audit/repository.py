"""Audit repository (admin domain)."""
from __future__ import annotations

from datetime import datetime
from typing import Optional, Sequence

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import AuditAction, AuditReferenceType
from app.core.repositories.base_repository import BaseRepository
from app.modules.admin.audit.models import AuditLog


class AuditRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_id(self, log_id: int) -> Optional[AuditLog]:
        return await self.scalar_one_or_none(select(AuditLog).where(AuditLog.id == log_id))

    async def list_logs(
        self,
        *,
        reference_type: Optional[AuditReferenceType] = None,
        reference_id: Optional[int] = None,
        action: Optional[AuditAction] = None,
        employment_id: Optional[int] = None,
        from_ts: Optional[datetime] = None,
        to_ts: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
        if reference_type is not None:
            stmt = stmt.where(AuditLog.reference_type == reference_type)
        if reference_id is not None:
            stmt = stmt.where(AuditLog.reference_id == reference_id)
        if action is not None:
            stmt = stmt.where(AuditLog.action == action)
        if employment_id is not None:
            stmt = stmt.where(AuditLog.employment_id == employment_id)
        if from_ts is not None:
            stmt = stmt.where(AuditLog.created_at >= from_ts)
        if to_ts is not None:
            stmt = stmt.where(AuditLog.created_at < to_ts)
        return await self.scalars(stmt.limit(limit).offset(offset))

    async def list_older_than(self, cutoff: datetime) -> Sequence[AuditLog]:
        stmt = select(AuditLog).where(AuditLog.created_at < cutoff).order_by(AuditLog.created_at)
        return await self.scalars(stmt)

    async def delete_older_than(self, cutoff: datetime) -> int:
        result = await self.execute(delete(AuditLog).where(AuditLog.created_at < cutoff))
        return result.rowcount or 0
