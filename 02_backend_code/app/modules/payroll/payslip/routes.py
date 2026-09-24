"""Payslip routes — get + pay."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.authorization import AuthContext, require_permission
from app.modules.payroll.dependencies import PayslipServiceDep
from app.modules.payroll.monthly_payroll.schemas import (
    MonthlyPayrollResponse,
    PayrollPaymentRequest,
)

router = APIRouter(prefix="/payroll", tags=["Payroll — Payslip"])


@router.post("/{payroll_id}/pay", response_model=MonthlyPayrollResponse)
async def mark_paid(
    payroll_id: int,
    body: PayrollPaymentRequest,
    service: PayslipServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("payroll", "UPDATE", "ORGANIZATION"))],
) -> MonthlyPayrollResponse:
    return await service.mark_paid(payroll_id, body, actor_employment_id=auth.employment_id)


@router.get("/{payroll_id}", response_model=MonthlyPayrollResponse, dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def get_payroll(
    payroll_id: int, service: PayslipServiceDep
) -> MonthlyPayrollResponse:
    return await service.get_payroll(payroll_id)
