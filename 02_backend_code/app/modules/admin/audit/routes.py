"""Audit domain routes (admin)."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import require_permission
from app.core.database import get_db_session
from app.core.db.enums import AuditAction, AuditReferenceType
from app.modules.admin.audit.schemas import ArchiveResult, AuditLogCreate, AuditLogResponse
from app.modules.admin.audit.service import AuditService

router = APIRouter(prefix="/audit", tags=["Admin / Audit"])


def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> AuditService:
    return AuditService(session)


ServiceDep = Annotated[AuditService, Depends(get_service)]


@router.post("/logs", response_model=AuditLogResponse | None, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("audit", "CREATE", "ORGANIZATION"))])
async def create_log(body: AuditLogCreate, service: ServiceDep) -> AuditLogResponse | None:
    return await service.log(body)


@router.get("/logs", response_model=list[AuditLogResponse], dependencies=[Depends(require_permission("audit", "VIEW", "ORGANIZATION"))])
async def list_logs(
    service: ServiceDep,
    reference_type: AuditReferenceType | None = Query(None),
    reference_id: int | None = Query(None),
    action: AuditAction | None = Query(None),
    employment_id: int | None = Query(None),
    from_ts: datetime | None = Query(None),
    to_ts: datetime | None = Query(None),
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


@router.get("/logs/{log_id}", response_model=AuditLogResponse, dependencies=[Depends(require_permission("audit", "VIEW", "ORGANIZATION"))])
async def get_log(log_id: int, service: ServiceDep) -> AuditLogResponse:
    return await service.get(log_id)


@router.post("/archive", response_model=ArchiveResult, dependencies=[Depends(require_permission("audit", "UPDATE", "ORGANIZATION"))])
async def archive_old_logs(
    service: ServiceDep,
    retention_days: int = Query(10, ge=1, le=365),
) -> ArchiveResult:
    return await service.archive_old_logs(retention_days=retention_days)
