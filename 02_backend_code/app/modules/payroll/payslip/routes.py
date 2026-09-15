"""Payslip routes — get + pay."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header

from app.modules.payroll.dependencies import PayslipServiceDep
from app.modules.payroll.monthly_payroll.schemas import (
    MonthlyPayrollResponse,
    PayrollPaymentRequest,
)

router = APIRouter(prefix="/payroll", tags=["Payroll — Payslip"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("/{payroll_id}/pay", response_model=MonthlyPayrollResponse)
async def mark_paid(
    payroll_id: int,
    body: PayrollPaymentRequest,
    service: PayslipServiceDep,
    actor: ActorHeader = None,
) -> MonthlyPayrollResponse:
    return await service.mark_paid(payroll_id, body, actor_employment_id=actor)


@router.get("/{payroll_id}", response_model=MonthlyPayrollResponse)
async def get_payroll(
    payroll_id: int, service: PayslipServiceDep
) -> MonthlyPayrollResponse:
    return await service.get_payroll(payroll_id)
