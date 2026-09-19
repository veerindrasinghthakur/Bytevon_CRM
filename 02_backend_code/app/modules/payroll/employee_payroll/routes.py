"""Employee payroll routes — employees list + bank accounts."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.core.database import get_db_session
from app.core.serialization import enforce_sensitive_write, filter_sensitive_fields
from app.modules.payroll.dependencies import EmployeePayrollServiceDep
from app.modules.payroll.employee_payroll.schemas import (
    BankAccountCreate,
    BankAccountResponse,
)

router = APIRouter(prefix="/payroll", tags=["Payroll — Employee"])


async def _filtered_bank_response(
    response: BankAccountResponse,
    *,
    auth: AuthContext,
    session: AsyncSession,
) -> dict:
    payload = jsonable_encoder(response)
    return await filter_sensitive_fields(
        payload, resource="salary", auth=auth, session=session
    )


@router.get("/employees", dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def list_payroll_employees(
    service: EmployeePayrollServiceDep,
    year: int | None = Query(None),
    month: int | None = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    search: str | None = Query(None),
) -> dict[str, Any]:
    return await service.list_employees(
        year=year, month=month, page=page, page_size=pageSize, search=search
    )


@router.post(
    "/bank-accounts",
    response_model=BankAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_bank_account(
    body: BankAccountCreate,
    service: EmployeePayrollServiceDep,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    auth: Annotated[AuthContext, Depends(require_permission("salary", "CREATE", "ORGANIZATION"))],
) -> BankAccountResponse:
    await enforce_sensitive_write(
        body.model_dump(mode="json"), resource="salary", auth=auth, session=session
    )
    return await service.add_bank_account(body, actor_employment_id=auth.employment_id)


@router.get("/bank-accounts/{employment_id}")
async def list_bank_accounts(
    employment_id: int,
    service: EmployeePayrollServiceDep,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    auth: Annotated[AuthContext, Depends(require_permission("salary", "VIEW", "CUSTOM"))],
) -> list[dict]:
    enforce_owner_or_grant(auth, "salary", "VIEW", owner_employment_id=employment_id)
    rows = await service.list_bank_accounts(employment_id)
    return [await _filtered_bank_response(r, auth=auth, session=session) for r in rows]


@router.get(
    "/bank-accounts/{employment_id}/primary",
)
async def get_primary_bank(
    employment_id: int,
    service: EmployeePayrollServiceDep,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    auth: Annotated[AuthContext, Depends(require_permission("salary", "VIEW", "CUSTOM"))],
) -> dict:
    enforce_owner_or_grant(auth, "salary", "VIEW", owner_employment_id=employment_id)
    row = await service.get_primary_bank(employment_id)
    return await _filtered_bank_response(row, auth=auth, session=session)
