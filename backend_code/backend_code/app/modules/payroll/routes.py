"""
Payroll HTTP routes.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.payroll.dependencies import PayrollServiceDep
from app.modules.payroll.schemas.schemas import (
    BankAccountCreate,
    BankAccountResponse,
    EmployeeSalaryCreate,
    EmployeeSalaryResponse,
    MessageResponse,
    MonthlyPayrollResponse,
    PayrollCalculateRequest,
    PayrollPaymentRequest,
)

router = APIRouter(prefix="/payroll", tags=["Payroll"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


# ---------------------------------------------------------------------------
# Salary
# ---------------------------------------------------------------------------

@router.post(
    "/salaries",
    response_model=EmployeeSalaryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_salary(
    body: EmployeeSalaryCreate,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> EmployeeSalaryResponse:
    return await service.create_salary(body, actor_employment_id=actor)


@router.get(
    "/salaries/current/{employment_id}",
    response_model=EmployeeSalaryResponse,
)
async def get_current_salary(
    employment_id: int,
    service: PayrollServiceDep,
    as_of: Optional[date] = Query(None),
) -> EmployeeSalaryResponse:
    return await service.get_current_salary(employment_id, as_of=as_of)


@router.get(
    "/salaries/{employment_id}",
    response_model=list[EmployeeSalaryResponse],
)
async def list_salaries(
    employment_id: int, service: PayrollServiceDep
) -> list[EmployeeSalaryResponse]:
    return await service.list_salaries(employment_id)


# ---------------------------------------------------------------------------
# Monthly payroll
# ---------------------------------------------------------------------------

@router.post(
    "/calculate",
    response_model=MonthlyPayrollResponse,
    status_code=status.HTTP_201_CREATED,
)
async def calculate_payroll(
    body: PayrollCalculateRequest,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> MonthlyPayrollResponse:
    return await service.calculate_payroll(body, actor_employment_id=actor)


@router.post(
    "/{payroll_id}/approve",
    response_model=MonthlyPayrollResponse,
)
async def approve_payroll(
    payroll_id: int,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> MonthlyPayrollResponse:
    return await service.approve_payroll(payroll_id, actor_employment_id=actor)


@router.post(
    "/{payroll_id}/pay",
    response_model=MonthlyPayrollResponse,
)
async def mark_paid(
    payroll_id: int,
    body: PayrollPaymentRequest,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> MonthlyPayrollResponse:
    return await service.mark_paid(payroll_id, body, actor_employment_id=actor)


@router.get("/{payroll_id}", response_model=MonthlyPayrollResponse)
async def get_payroll(
    payroll_id: int, service: PayrollServiceDep
) -> MonthlyPayrollResponse:
    return await service.get_payroll(payroll_id)


@router.get("", response_model=list[MonthlyPayrollResponse])
async def list_payrolls(
    service: PayrollServiceDep,
    employment_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> list[MonthlyPayrollResponse]:
    return await service.list_payrolls(
        employment_id=employment_id, year=year, month=month, limit=limit
    )


# ---------------------------------------------------------------------------
# Bank accounts
# ---------------------------------------------------------------------------

@router.post(
    "/bank-accounts",
    response_model=BankAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_bank_account(
    body: BankAccountCreate,
    service: PayrollServiceDep,
    actor: ActorHeader = None,
) -> BankAccountResponse:
    return await service.add_bank_account(body, actor_employment_id=actor)


@router.get(
    "/bank-accounts/{employment_id}",
    response_model=list[BankAccountResponse],
)
async def list_bank_accounts(
    employment_id: int, service: PayrollServiceDep
) -> list[BankAccountResponse]:
    return await service.list_bank_accounts(employment_id)


@router.get(
    "/bank-accounts/{employment_id}/primary",
    response_model=BankAccountResponse,
)
async def get_primary_bank(
    employment_id: int, service: PayrollServiceDep
) -> BankAccountResponse:
    return await service.get_primary_bank(employment_id)
