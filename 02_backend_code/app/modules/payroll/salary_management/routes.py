"""Salary management routes."""
from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.payroll.dependencies import SalaryManagementServiceDep
from app.modules.payroll.salary_management.schemas import (
    EmployeeSalaryCreate,
    EmployeeSalaryResponse,
)

router = APIRouter(prefix="/payroll", tags=["Payroll — Salary"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("/salaries", response_model=EmployeeSalaryResponse, status_code=status.HTTP_201_CREATED)
async def create_salary(
    body: EmployeeSalaryCreate,
    service: SalaryManagementServiceDep,
    actor: ActorHeader = None,
) -> EmployeeSalaryResponse:
    return await service.create_salary(body, actor_employment_id=actor)


@router.get("/salaries/current/{employment_id}", response_model=EmployeeSalaryResponse)
async def get_current_salary(
    employment_id: int,
    service: SalaryManagementServiceDep,
    as_of: Optional[date] = Query(None),
) -> EmployeeSalaryResponse:
    return await service.get_current_salary(employment_id, as_of=as_of)


@router.get("/salaries/{employment_id}", response_model=list[EmployeeSalaryResponse])
async def list_salaries(
    employment_id: int, service: SalaryManagementServiceDep
) -> list[EmployeeSalaryResponse]:
    return await service.list_salaries(employment_id)
