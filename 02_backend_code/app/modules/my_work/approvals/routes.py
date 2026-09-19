"""My Work Approvals routes."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.my_work.approvals.schemas import ApprovalListResponse
from app.modules.my_work.approvals.service import MyWorkApprovalsService

router = APIRouter(prefix="/my-work/approvals", tags=["My Work / Approvals"])


def get_approvals_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MyWorkApprovalsService:
    return MyWorkApprovalsService(session)


ServiceDep = Annotated[MyWorkApprovalsService, Depends(get_approvals_service)]


@router.get("", response_model=ApprovalListResponse)
async def list_my_approvals(
    service: ServiceDep,
    employment_id: Annotated[Optional[int], Query()] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
) -> ApprovalListResponse:
    return await service.list_my_approvals(
        employment_id=employment_id,
        status=status_filter,
        search=search,
        limit=20,
    )
