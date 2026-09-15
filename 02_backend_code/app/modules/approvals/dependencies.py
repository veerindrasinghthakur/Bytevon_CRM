"""Approvals domain dependencies."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.approvals.approval_action.service import ApprovalActionService
from app.modules.approvals.request.service import RequestService


def get_request_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RequestService:
    return RequestService(session)


def get_approval_action_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ApprovalActionService:
    return ApprovalActionService(session)


RequestServiceDep = Annotated[RequestService, Depends(get_request_service)]
ApprovalActionServiceDep = Annotated[
    ApprovalActionService, Depends(get_approval_action_service)
]

# Back-compat alias used by older route/import sites
ApprovalServiceDep = RequestServiceDep
