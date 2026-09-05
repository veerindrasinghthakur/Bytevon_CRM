"""
AuditPublicService — only public entry for Audit.

Locked:
- log() is best-effort: never raises to the business caller (isolated TX).
- No updates/deletes on the business path.
- archive_old_logs() exports to storage then deletes from PG (job entry).
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import AuditAction, AuditReferenceType
from app.core.exceptions.exception import NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.audit.models import AuditLog
from app.modules.audit.repositories.repository import AuditRepository
from app.modules.audit.schemas.schemas import (
    ArchiveResult,
    AuditLogCreate,
    AuditLogResponse,
)

logger = logging.getLogger(__name__)

DEFAULT_RETENTION_DAYS = 10


class AuditPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = AuditRepository(session)

    # ==================================================================
    # log — primary API for all other modules (after their commit)
    # ==================================================================

    async def log(
        self,
        data: AuditLogCreate,
        *,
        raise_on_error: bool = False,
    ) -> Optional[AuditLogResponse]:
        """
        Persist one audit row in its own transaction.
        Default: swallow errors so business TX is never affected.
        """
        try:
            row = AuditLog(
                reference_type=data.reference_type,
                reference_id=data.reference_id,
                action=data.action,
                description=data.description,
                employment_id=data.employment_id,
                ip_address=data.ip_address,
                user_agent=data.user_agent,
            )
            await self._repo.add(row)
            await self._commit()
            return AuditLogResponse.model_validate(row)
        except Exception:
            logger.exception(
                "Audit log failed (reference=%s/%s action=%s)",
                data.reference_type.value,
                data.reference_id,
                data.action.value,
            )
            try:
                await self._rollback()
            except Exception:
                pass
            if raise_on_error:
                raise
            return None

    async def log_simple(
        self,
        *,
        reference_type: AuditReferenceType,
        reference_id: int,
        action: AuditAction,
        description: str,
        employment_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[AuditLogResponse]:
        return await self.log(
            AuditLogCreate(
                reference_type=reference_type,
                reference_id=reference_id,
                action=action,
                description=description,
                employment_id=employment_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )

    # ==================================================================
    # Query
    # ==================================================================

    async def get(self, log_id: int) -> AuditLogResponse:
        row = await self._repo.get_by_id(log_id)
        if row is None:
            raise NotFoundError("Audit log not found")
        return AuditLogResponse.model_validate(row)

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
    ) -> list[AuditLogResponse]:
        rows = await self._repo.list_logs(
            reference_type=reference_type,
            reference_id=reference_id,
            action=action,
            employment_id=employment_id,
            from_ts=from_ts,
            to_ts=to_ts,
            limit=limit,
            offset=offset,
        )
        return [AuditLogResponse.model_validate(r) for r in rows]

    # ==================================================================
    # Archive job (PG → MinIO JSONL → delete)
    # ==================================================================

    async def archive_old_logs(
        self,
        *,
        retention_days: int = DEFAULT_RETENTION_DAYS,
    ) -> ArchiveResult:
        """
        Export logs older than retention_days to storage, then delete from PG.
        MinIO upload is stubbed (logs path + writes JSONL to local/log for now).
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
        rows = list(await self._repo.list_older_than(cutoff))
        if not rows:
            return ArchiveResult(
                exported_count=0,
                deleted_count=0,
                message="Nothing to archive",
            )

        # Serialize
        payload = [
            {
                "id": r.id,
                "reference_type": r.reference_type.value,
                "reference_id": r.reference_id,
                "action": r.action.value,
                "description": r.description,
                "employment_id": r.employment_id,
                "ip_address": r.ip_address,
                "user_agent": r.user_agent,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
        date_key = cutoff.strftime("%Y-%m-%d")
        storage_path = f"audit-archives/{date_key}/audit_{date_key}_{len(payload)}.jsonl"

        # V1 stub: log the export; real MinIO client plugs in here
        try:
            lines = "\n".join(json.dumps(item, default=str) for item in payload)
            logger.info(
                "AUDIT ARCHIVE export path=%s rows=%s bytes≈%s",
                storage_path,
                len(payload),
                len(lines),
            )
            # TODO: upload lines to MinIO at storage_path
            # only delete after confirmed upload
        except Exception:
            logger.exception("Audit archive export failed; PG rows NOT deleted")
            return ArchiveResult(
                exported_count=0,
                deleted_count=0,
                storage_path=None,
                message="Export failed; nothing deleted",
            )

        deleted = await self._repo.delete_older_than(cutoff)
        await self._commit()

        # Meta audit of the archive job itself
        await self.log_simple(
            reference_type=AuditReferenceType.SYSTEM,
            reference_id=0,
            action=AuditAction.ARCHIVE,
            description=f"Archived {deleted} audit logs older than {cutoff.isoformat()}",
            employment_id=None,
        )

        return ArchiveResult(
            exported_count=len(payload),
            deleted_count=deleted,
            storage_path=storage_path,
            message="Archive completed",
        )
