"""
Audit HTTP routes (query + manual archive trigger).
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query, status

from app.core.db.enums import AuditAction, AuditReferenceType
from app.modules.audit.dependencies import AuditServiceDep
from app.modules.audit.schemas.schemas import (
    ArchiveResult,
    AuditLogCreate,
    AuditLogResponse,
)

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.post(
    "/logs",
    response_model=Optional[AuditLogResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Write audit log (also used in-process by other services)",
)
async def create_log(
    body: AuditLogCreate,
    service: AuditServiceDep,
) -> Optional[AuditLogResponse]:
    return await service.log(body)


@router.get("/logs", response_model=list[AuditLogResponse])
async def list_logs(
    service: AuditServiceDep,
    reference_type: Optional[AuditReferenceType] = Query(None),
    reference_id: Optional[int] = Query(None),
    action: Optional[AuditAction] = Query(None),
    employment_id: Optional[int] = Query(None),
    from_ts: Optional[datetime] = Query(None),
    to_ts: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[AuditLogResponse]:
    return await service.list_logs(
        reference_type=reference_type,
        reference_id=reference_id,
        action=action,
        employment_id=employment_id,
        from_ts=from_ts,
        to_ts=to_ts,
        limit=limit,
        offset=offset,
    )


@router.get("/logs/{log_id}", response_model=AuditLogResponse)
async def get_log(log_id: int, service: AuditServiceDep) -> AuditLogResponse:
    return await service.get(log_id)


@router.post("/archive", response_model=ArchiveResult)
async def archive_old_logs(
    service: AuditServiceDep,
    retention_days: int = Query(10, ge=1, le=365),
) -> ArchiveResult:
    """Manual / job trigger: export old logs then delete from PostgreSQL."""
    return await service.archive_old_logs(retention_days=retention_days)
