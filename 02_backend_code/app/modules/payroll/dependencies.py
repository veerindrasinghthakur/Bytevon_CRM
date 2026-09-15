"""Payroll domain dependencies — no thin public-service layer."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.payroll.dashboard.service import DashboardService
from app.modules.payroll.employee_payroll.service import EmployeePayrollService
from app.modules.payroll.history.service import HistoryService
from app.modules.payroll.monthly_payroll.service import MonthlyPayrollService
from app.modules.payroll.payroll_run.service import PayrollRunService
from app.modules.payroll.payslip.service import PayslipService
from app.modules.payroll.review.service import ReviewService
from app.modules.payroll.salary_management.service import SalaryManagementService


def get_dashboard_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DashboardService:
    return DashboardService(session)


def get_monthly_payroll_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MonthlyPayrollService:
    return MonthlyPayrollService(session)


def get_salary_management_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SalaryManagementService:
    return SalaryManagementService(session)


def get_employee_payroll_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> EmployeePayrollService:
    return EmployeePayrollService(session)


def get_history_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> HistoryService:
    return HistoryService(session)


def get_payroll_run_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PayrollRunService:
    return PayrollRunService(session)


def get_review_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ReviewService:
    return ReviewService(session)


def get_payslip_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PayslipService:
    return PayslipService(session)


DashboardServiceDep = Annotated[DashboardService, Depends(get_dashboard_service)]
MonthlyPayrollServiceDep = Annotated[
    MonthlyPayrollService, Depends(get_monthly_payroll_service)
]
SalaryManagementServiceDep = Annotated[
    SalaryManagementService, Depends(get_salary_management_service)
]
EmployeePayrollServiceDep = Annotated[
    EmployeePayrollService, Depends(get_employee_payroll_service)
]
HistoryServiceDep = Annotated[HistoryService, Depends(get_history_service)]
PayrollRunServiceDep = Annotated[PayrollRunService, Depends(get_payroll_run_service)]
ReviewServiceDep = Annotated[ReviewService, Depends(get_review_service)]
PayslipServiceDep = Annotated[PayslipService, Depends(get_payslip_service)]
