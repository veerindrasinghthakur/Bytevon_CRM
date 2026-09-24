"""Monthly payroll domain routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.modules.payroll.dependencies import MonthlyPayrollServiceDep
from app.modules.payroll.monthly_payroll.schemas import (
    MonthlyPayrollResponse,
    PayrollCalculateRequest,
)

router = APIRouter(prefix="/payroll", tags=["Payroll — Monthly"])


@router.post("/calculate", response_model=MonthlyPayrollResponse, status_code=status.HTTP_201_CREATED)
async def calculate_payroll(
    body: PayrollCalculateRequest,
    service: MonthlyPayrollServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))],
) -> MonthlyPayrollResponse:
    return await service.calculate_payroll(body, actor_employment_id=auth.employment_id)


@router.get("", response_model=list[MonthlyPayrollResponse], dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def list_payrolls(
    service: MonthlyPayrollServiceDep,
    employment_id: int | None = Query(None),
    year: int | None = Query(None),
    month: int | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> list[MonthlyPayrollResponse]:
    return await service.list_payrolls(
        employment_id=employment_id, year=year, month=month, limit=limit
    )
