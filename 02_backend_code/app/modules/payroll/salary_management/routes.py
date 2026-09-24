"""Salary management routes."""
from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.core.database import get_db_session
from app.core.serialization import enforce_sensitive_write, filter_sensitive_fields
from app.modules.payroll.dependencies import SalaryManagementServiceDep
from app.modules.payroll.salary_management.schemas import (
    EmployeeSalaryCreate,
    EmployeeSalaryResponse,
)

router = APIRouter(prefix="/payroll", tags=["Payroll — Salary"])


async def _filtered_salary_response(
    response: EmployeeSalaryResponse,
    *,
    auth: AuthContext,
    session: AsyncSession,
) -> dict:
    payload = jsonable_encoder(response)
    return await filter_sensitive_fields(
        payload, resource="salary", auth=auth, session=session
    )


@router.post("/salaries", response_model=EmployeeSalaryResponse, status_code=status.HTTP_201_CREATED)
async def create_salary(
    body: EmployeeSalaryCreate,
    service: SalaryManagementServiceDep,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    auth: Annotated[AuthContext, Depends(require_permission("salary", "CREATE", "ORGANIZATION"))],
) -> EmployeeSalaryResponse:
    await enforce_sensitive_write(
        body.model_dump(mode="json"), resource="salary", auth=auth, session=session
    )
    return await service.create_salary(body, actor_employment_id=auth.employment_id)


@router.get("/salaries/current/{employment_id}")
async def get_current_salary(
    employment_id: int,
    service: SalaryManagementServiceDep,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    # TODO(ScopeResolver): was CUSTOM; scope-union via enforce_owner_or_grant
    auth: Annotated[AuthContext, Depends(require_permission("salary", "VIEW", "SELF", union=True))],
    as_of: date | None = Query(None),
) -> dict:
    enforce_owner_or_grant(auth, "salary", "VIEW", owner_employment_id=employment_id)
    salary = await service.get_current_salary(employment_id, as_of=as_of)
    return await _filtered_salary_response(salary, auth=auth, session=session)


@router.get("/salaries/{employment_id}")
async def list_salaries(
    employment_id: int,
    service: SalaryManagementServiceDep,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    auth: Annotated[AuthContext, Depends(require_permission("salary", "VIEW", "SELF", union=True))],
) -> list[dict]:
    enforce_owner_or_grant(auth, "salary", "VIEW", owner_employment_id=employment_id)
    rows = await service.list_salaries(employment_id)
    return [
        await _filtered_salary_response(r, auth=auth, session=session) for r in rows
    ]
