"""Workforce dependencies — domain services."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.workforce.assignment.service import AssignmentService
from app.modules.workforce.attendance.service import AttendanceService
from app.modules.workforce.department.service import DepartmentService
from app.modules.workforce.employee.service import EmployeeService


def get_employee_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> EmployeeService:
    return EmployeeService(session)


def get_assignment_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AssignmentService:
    return AssignmentService(session)


def get_department_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DepartmentService:
    return DepartmentService(session)


def get_attendance_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AttendanceService:
    return AttendanceService(session)


EmployeeServiceDep = Annotated[EmployeeService, Depends(get_employee_service)]
AssignmentServiceDep = Annotated[AssignmentService, Depends(get_assignment_service)]
DepartmentServiceDep = Annotated[DepartmentService, Depends(get_department_service)]
AttendanceServiceDep = Annotated[AttendanceService, Depends(get_attendance_service)]

# Back-compat aliases
EmploymentServiceDep = EmployeeServiceDep
EmploymentPublicService = EmployeeService
