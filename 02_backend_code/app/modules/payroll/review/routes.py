"""Review routes — approve."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header

from app.modules.payroll.dependencies import ReviewServiceDep
from app.modules.payroll.monthly_payroll.schemas import MonthlyPayrollResponse

router = APIRouter(prefix="/payroll", tags=["Payroll — Review"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("/{payroll_id}/approve", response_model=MonthlyPayrollResponse)
async def approve_payroll(
    payroll_id: int,
    service: ReviewServiceDep,
    actor: ActorHeader = None,
) -> MonthlyPayrollResponse:
    return await service.approve_payroll(payroll_id, actor_employment_id=actor)
