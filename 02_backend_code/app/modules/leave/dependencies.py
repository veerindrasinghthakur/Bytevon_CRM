"""Leave dependencies — domain services."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.leave.ledger.service import LedgerService
from app.modules.leave.policy.service import PolicyService
from app.modules.leave.request.service import RequestService


def get_policy_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PolicyService:
    return PolicyService(session)


def get_request_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RequestService:
    return RequestService(session)


def get_ledger_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> LedgerService:
    return LedgerService(session)


PolicyServiceDep = Annotated[PolicyService, Depends(get_policy_service)]
RequestServiceDep = Annotated[RequestService, Depends(get_request_service)]
LedgerServiceDep = Annotated[LedgerService, Depends(get_ledger_service)]

# Back-compat for lifespan / external callers
LeaveServiceDep = RequestServiceDep
LeavePublicService = RequestService
