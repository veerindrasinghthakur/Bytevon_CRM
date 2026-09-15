"""Employee payroll routes — employees list + bank accounts."""
from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.payroll.dependencies import EmployeePayrollServiceDep
from app.modules.payroll.employee_payroll.schemas import (
    BankAccountCreate,
    BankAccountResponse,
)

router = APIRouter(prefix="/payroll", tags=["Payroll — Employee"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.get("/employees")
async def list_payroll_employees(
    service: EmployeePayrollServiceDep,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
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
    actor: ActorHeader = None,
) -> BankAccountResponse:
    return await service.add_bank_account(body, actor_employment_id=actor)


@router.get("/bank-accounts/{employment_id}", response_model=list[BankAccountResponse])
async def list_bank_accounts(
    employment_id: int, service: EmployeePayrollServiceDep
) -> list[BankAccountResponse]:
    return await service.list_bank_accounts(employment_id)


@router.get(
    "/bank-accounts/{employment_id}/primary",
    response_model=BankAccountResponse,
)
async def get_primary_bank(
    employment_id: int, service: EmployeePayrollServiceDep
) -> BankAccountResponse:
    return await service.get_primary_bank(employment_id)
