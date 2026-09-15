"""Monthly payroll domain routes."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.payroll.dependencies import MonthlyPayrollServiceDep
from app.modules.payroll.monthly_payroll.schemas import (
    MonthlyPayrollResponse,
    PayrollCalculateRequest,
)

router = APIRouter(prefix="/payroll", tags=["Payroll — Monthly"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("/calculate", response_model=MonthlyPayrollResponse, status_code=status.HTTP_201_CREATED)
async def calculate_payroll(
    body: PayrollCalculateRequest,
    service: MonthlyPayrollServiceDep,
    actor: ActorHeader = None,
) -> MonthlyPayrollResponse:
    return await service.calculate_payroll(body, actor_employment_id=actor)


@router.get("", response_model=list[MonthlyPayrollResponse])
async def list_payrolls(
    service: MonthlyPayrollServiceDep,
    employment_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> list[MonthlyPayrollResponse]:
    return await service.list_payrolls(
        employment_id=employment_id, year=year, month=month, limit=limit
    )
