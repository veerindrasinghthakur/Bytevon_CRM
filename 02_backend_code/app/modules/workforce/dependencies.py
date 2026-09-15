"""Workforce dependencies — domain services."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.workforce.employee.service import EmployeeService
from app.modules.workforce.assignment.service import AssignmentService


def get_employee_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> EmployeeService:
    return EmployeeService(session)


def get_assignment_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AssignmentService:
    return AssignmentService(session)


EmployeeServiceDep = Annotated[EmployeeService, Depends(get_employee_service)]
AssignmentServiceDep = Annotated[AssignmentService, Depends(get_assignment_service)]

# Back-compat alias used by any leftover callers
EmploymentServiceDep = EmployeeServiceDep
EmploymentPublicService = EmployeeService
