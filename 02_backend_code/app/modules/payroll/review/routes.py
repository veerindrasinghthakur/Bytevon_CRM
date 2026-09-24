"""Review routes — approve."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.authorization import AuthContext, require_permission
from app.modules.payroll.dependencies import ReviewServiceDep
from app.modules.payroll.monthly_payroll.schemas import MonthlyPayrollResponse

router = APIRouter(prefix="/payroll", tags=["Payroll — Review"])


class PayrollRejectBody(BaseModel):
    reason: str


@router.post("/{payroll_id}/approve", response_model=MonthlyPayrollResponse)
async def approve_payroll(
    payroll_id: int,
    service: ReviewServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("payroll", "APPROVE", "ORGANIZATION"))],
) -> MonthlyPayrollResponse:
    return await service.approve_payroll(payroll_id, actor_employment_id=auth.employment_id)


@router.post("/{payroll_id}/reject", response_model=MonthlyPayrollResponse)
async def reject_payroll(
    payroll_id: int,
    body: PayrollRejectBody,
    service: ReviewServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("payroll", "APPROVE", "ORGANIZATION"))],
) -> MonthlyPayrollResponse:
    """Q4: APPROVED → CALCULATED reject/reset with reason + audit."""
    return await service.reject_payroll(
        payroll_id, reason=body.reason, actor_employment_id=auth.employment_id
    )
