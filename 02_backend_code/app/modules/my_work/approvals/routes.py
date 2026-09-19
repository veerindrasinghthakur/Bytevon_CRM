"""My Work Approvals routes."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.database import get_db_session
from app.modules.my_work.approvals.schemas import ApprovalListResponse
from app.modules.my_work.approvals.service import MyWorkApprovalsService

router = APIRouter(prefix="/my-work/approvals", tags=["My Work / Approvals"])


def get_approvals_service(session: Annotated[Any, Depends(get_db_session)]) -> MyWorkApprovalsService:
    return MyWorkApprovalsService(session)


ServiceDep = Any  # Annotated[MyWorkApprovalsService, Depends(get_approvals_service)]


@router.get("", response_model=ApprovalListResponse)
async def list_my_approvals(
    service: ServiceDep,
    employment_id: Annotated[Optional[int], Query()] = None,
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> ApprovalListResponse:
    return await service.list_my_approvals(
        employment_id=employment_id,
        status=status,
        search=search,
        limit=20,
    )