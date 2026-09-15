"""
Organization HTTP routes.

Policy masters (incl. attendance policies) live here.
Operational departments also still exposed for legacy clients; preferred path is /workforce/departments.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.organization.dependencies import OrganizationServiceDep
from app.modules.organization.schemas.schemas import (
    AdminUserCreate,
    AdminUserDetailResponse,
    AdminUserListResponse,
    AdminUserUpdate,
    DepartmentAssignRequest,
    DepartmentCreate,
    DepartmentEmployeeListResponse,
    DepartmentEmployeeOption,
    DepartmentResponse,
    DepartmentUpdate,
    EmploymentWithoutLogin,
    HolidayCalendarCreate,
    HolidayCalendarResponse,
    HolidayCalendarUpdate,
    HolidayCreate,
    HolidayResponse,
    HolidayUpdate,
    LocationCreate,
    LocationResponse,
    LocationUpdate,
    MessageResponse,
    OrganizationSettingsResponse,
    OrganizationSettingsUpdate,
    ShiftCreate,
    ShiftResponse,
    ShiftUpdate,
    WorkingWeekCreate,
    WorkingWeekResponse,
)
from app.modules.workforce.dependencies import AttendanceServiceDep
from app.modules.workforce.attendance.schemas import (
    AttendancePolicyCreate,
    AttendancePolicyResponse,
)

router = APIRouter(prefix="/organization", tags=["Organization"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


# ---------------------------------------------------------------------------
# Departments (legacy — prefer /workforce/departments)
# ---------------------------------------------------------------------------

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(body: DepartmentCreate, service: OrganizationServiceDep, actor: ActorHeader = None) -> DepartmentResponse:
    return await service.create_department(body, actor_employment_id=actor)


@router.get("/departments", response_model=list[DepartmentResponse])
async def list_departments(service: OrganizationServiceDep, include_archived: bool = Query(False)) -> list[DepartmentResponse]:
    return await service.list_departments(include_archived=include_archived)


@router.get("/departments/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: int, service: OrganizationServiceDep) -> DepartmentResponse:
    return await service.get_department(department_id)


@router.patch("/departments/{department_id}", response_model=DepartmentResponse)
async def update_department(department_id: int, body: DepartmentUpdate, service: OrganizationServiceDep, actor: ActorHeader = None) -> DepartmentResponse:
    return await service.update_department(department_id, body, actor_employment_id=actor)


@router.post("/departments/{department_id}/archive", response_model=MessageResponse)
async def archive_department(department_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive_department(department_id, actor_employment_id=actor)


@router.get("/departments/{department_id}/employees", response_model=DepartmentEmployeeListResponse)
async def list_department_employees(department_id: int, service: OrganizationServiceDep, page: int = Query(1, ge=1), pageSize: int = Query(50, ge=1, le=200), search: Optional[str] = Query(None)) -> DepartmentEmployeeListResponse:
    return await service.list_department_employees(department_id, page=page, page_size=pageSize, search=search)


@router.get("/departments/{department_id}/employees-available", response_model=list[DepartmentEmployeeOption])
async def list_employees_available_for_department(department_id: int, service: OrganizationServiceDep) -> list[DepartmentEmployeeOption]:
    return await service.list_employees_available_for_department(department_id)


@router.post("/departments/{department_id}/assign", response_model=MessageResponse)
async def assign_employee_to_department(department_id: int, body: DepartmentAssignRequest, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.assign_employee_to_department(department_id, body.employmentId, actor_employment_id=actor)


@router.post("/departments/{department_id}/remove", response_model=MessageResponse)
async def remove_employee_from_department(department_id: int, body: DepartmentAssignRequest, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.remove_employee_from_department(department_id, body.employmentId, actor_employment_id=actor)


# ---------------------------------------------------------------------------
# Working Weeks / Shifts / Holidays / Locations / Settings / Users
# (unchanged)
# ---------------------------------------------------------------------------

@router.post("/working-weeks", response_model=WorkingWeekResponse, status_code=status.HTTP_201_CREATED)
async def create_working_week(body: WorkingWeekCreate, service: OrganizationServiceDep, actor: ActorHeader = None) -> WorkingWeekResponse:
    return await service.create_working_week(body, actor_employment_id=actor)


@router.get("/working-weeks", response_model=list[WorkingWeekResponse])
async def list_working_weeks(service: OrganizationServiceDep) -> list[WorkingWeekResponse]:
    return await service.list_working_weeks()


@router.get("/working-weeks/current", response_model=WorkingWeekResponse)
async def get_current_working_week(service: OrganizationServiceDep, as_of: Optional[date] = Query(None)) -> WorkingWeekResponse:
    return await service.get_current_working_week(as_of=as_of)


@router.get("/working-weeks/{week_id}", response_model=WorkingWeekResponse)
async def get_working_week(week_id: int, service: OrganizationServiceDep) -> WorkingWeekResponse:
    return await service.get_working_week(week_id)


@router.post("/working-weeks/{week_id}/archive", response_model=MessageResponse)
async def archive_working_week(week_id: int, service: OrganizationServiceDep, actor: ActorHeader = None, effective_to: Optional[date] = Query(None)) -> MessageResponse:
    return await service.archive_working_week(week_id, actor_employment_id=actor, effective_to=effective_to)


@router.post("/shifts", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def create_shift(body: ShiftCreate, service: OrganizationServiceDep, actor: ActorHeader = None) -> ShiftResponse:
    return await service.create_shift(body, actor_employment_id=actor)


@router.get("/shifts", response_model=list[ShiftResponse])
async def list_shifts(service: OrganizationServiceDep, include_archived: bool = Query(False)) -> list[ShiftResponse]:
    return await service.list_shifts(include_archived=include_archived)


@router.get("/shifts/{shift_id}", response_model=ShiftResponse)
async def get_shift(shift_id: int, service: OrganizationServiceDep) -> ShiftResponse:
    return await service.get_shift(shift_id)


@router.get("/shifts/{shift_id}/employees")
async def list_shift_employees(shift_id: int, service: OrganizationServiceDep) -> list[dict[str, Any]]:
    return await service.list_shift_employees(shift_id)


@router.patch("/shifts/{shift_id}", response_model=ShiftResponse)
async def update_shift(shift_id: int, body: ShiftUpdate, service: OrganizationServiceDep, actor: ActorHeader = None) -> ShiftResponse:
    return await service.update_shift(shift_id, body, actor_employment_id=actor)


@router.post("/shifts/{shift_id}/archive", response_model=MessageResponse)
async def archive_shift(shift_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive_shift(shift_id, actor_employment_id=actor)


@router.post("/holiday-calendars", response_model=HolidayCalendarResponse, status_code=status.HTTP_201_CREATED)
async def create_holiday_calendar(body: HolidayCalendarCreate, service: OrganizationServiceDep, actor: ActorHeader = None) -> HolidayCalendarResponse:
    return await service.create_holiday_calendar(body, actor_employment_id=actor)


@router.get("/holiday-calendars", response_model=list[HolidayCalendarResponse])
async def list_holiday_calendars(service: OrganizationServiceDep, include_archived: bool = Query(False)) -> list[HolidayCalendarResponse]:
    return await service.list_holiday_calendars(include_archived=include_archived)


@router.get("/holiday-calendars/{calendar_id}", response_model=HolidayCalendarResponse)
async def get_holiday_calendar(calendar_id: int, service: OrganizationServiceDep) -> HolidayCalendarResponse:
    return await service.get_holiday_calendar(calendar_id)


@router.patch("/holiday-calendars/{calendar_id}", response_model=HolidayCalendarResponse)
async def update_holiday_calendar(calendar_id: int, body: HolidayCalendarUpdate, service: OrganizationServiceDep, actor: ActorHeader = None) -> HolidayCalendarResponse:
    return await service.update_holiday_calendar(calendar_id, body, actor_employment_id=actor)


@router.post("/holiday-calendars/{calendar_id}/archive", response_model=MessageResponse)
async def archive_holiday_calendar(calendar_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive_holiday_calendar(calendar_id, actor_employment_id=actor)


@router.post("/holidays", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
async def add_holiday(body: HolidayCreate, service: OrganizationServiceDep, actor: ActorHeader = None) -> HolidayResponse:
    return await service.add_holiday(body, actor_employment_id=actor)


@router.get("/holiday-calendars/{calendar_id}/holidays", response_model=list[HolidayResponse])
async def list_holidays_for_calendar(calendar_id: int, service: OrganizationServiceDep) -> list[HolidayResponse]:
    return await service.list_holidays(calendar_id)


@router.get("/holidays/{holiday_id}", response_model=HolidayResponse)
async def get_holiday(holiday_id: int, service: OrganizationServiceDep) -> HolidayResponse:
    return await service.get_holiday(holiday_id)


@router.patch("/holidays/{holiday_id}", response_model=HolidayResponse)
async def update_holiday(holiday_id: int, body: HolidayUpdate, service: OrganizationServiceDep, actor: ActorHeader = None) -> HolidayResponse:
    return await service.update_holiday(holiday_id, body, actor_employment_id=actor)


@router.delete("/holidays/{holiday_id}", response_model=MessageResponse)
async def delete_holiday(holiday_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.delete_holiday(holiday_id, actor_employment_id=actor)


@router.post("/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(body: LocationCreate, service: OrganizationServiceDep, actor: ActorHeader = None) -> LocationResponse:
    return await service.create_location(body, actor_employment_id=actor)


@router.get("/locations", response_model=list[LocationResponse])
async def list_locations(service: OrganizationServiceDep, include_archived: bool = Query(False)) -> list[LocationResponse]:
    return await service.list_locations(include_archived=include_archived)


@router.get("/locations/{location_id}", response_model=LocationResponse)
async def get_location(location_id: int, service: OrganizationServiceDep) -> LocationResponse:
    return await service.get_location(location_id)


@router.patch("/locations/{location_id}", response_model=LocationResponse)
async def update_location(location_id: int, body: LocationUpdate, service: OrganizationServiceDep, actor: ActorHeader = None) -> LocationResponse:
    return await service.update_location(location_id, body, actor_employment_id=actor)


@router.post("/locations/{location_id}/archive", response_model=MessageResponse)
async def archive_location(location_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive_location(location_id, actor_employment_id=actor)


@router.get("/settings", response_model=OrganizationSettingsResponse)
async def get_organization_settings(service: OrganizationServiceDep) -> OrganizationSettingsResponse:
    return await service.get_organization_settings()


@router.patch("/settings", response_model=OrganizationSettingsResponse)
@router.put("/settings", response_model=OrganizationSettingsResponse)
async def upsert_organization_settings(body: OrganizationSettingsUpdate, service: OrganizationServiceDep, actor: ActorHeader = None) -> OrganizationSettingsResponse:
    return await service.upsert_organization_settings(body, actor_employment_id=actor)


# ---------------------------------------------------------------------------
# Attendance policies (admin settings — was /attendance/policies)
# ---------------------------------------------------------------------------

@router.post("/attendance-policies", response_model=AttendancePolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_attendance_policy(body: AttendancePolicyCreate, service: AttendanceServiceDep, actor: ActorHeader = None) -> AttendancePolicyResponse:
    return await service.create_policy(body, actor_employment_id=actor)


@router.get("/attendance-policies", response_model=list[AttendancePolicyResponse])
async def list_attendance_policies(service: AttendanceServiceDep) -> list[AttendancePolicyResponse]:
    return await service.list_policies()


@router.get("/attendance-policies/current", response_model=AttendancePolicyResponse)
async def get_current_attendance_policy(service: AttendanceServiceDep, as_of: Optional[date] = Query(None)) -> AttendancePolicyResponse:
    return await service.get_current_policy(as_of=as_of)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@router.get("/users", response_model=AdminUserListResponse)
async def list_users(service: OrganizationServiceDep, search: Optional[str] = Query(None), user_status: Optional[str] = Query(None, alias="status"), department: Optional[str] = Query(None), role: Optional[str] = Query(None), dateFrom: Optional[str] = Query(None), dateTo: Optional[str] = Query(None), page: int = Query(1, ge=1), pageSize: int = Query(20, ge=1, le=200)) -> AdminUserListResponse:
    return await service.list_admin_users(search=search, status=user_status, department=department, role=role, date_from=dateFrom, date_to=dateTo, page=page, page_size=pageSize)


@router.get("/employments-without-login", response_model=list[EmploymentWithoutLogin])
async def list_employments_without_login(service: OrganizationServiceDep) -> list[EmploymentWithoutLogin]:
    return await service.list_employments_without_login()


@router.get("/users/{login_id}", response_model=AdminUserDetailResponse)
async def get_user(login_id: int, service: OrganizationServiceDep) -> AdminUserDetailResponse:
    return await service.get_admin_user(login_id)


@router.post("/users", response_model=AdminUserDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_user(body: AdminUserCreate, service: OrganizationServiceDep, actor: ActorHeader = None) -> AdminUserDetailResponse:
    return await service.create_admin_user(body, actor_employment_id=actor)


@router.patch("/users/{login_id}", response_model=AdminUserDetailResponse)
async def update_user(login_id: int, body: AdminUserUpdate, service: OrganizationServiceDep, actor: ActorHeader = None) -> AdminUserDetailResponse:
    return await service.update_admin_user(login_id, body, actor_employment_id=actor)


@router.post("/users/{login_id}/deactivate", response_model=MessageResponse)
async def deactivate_user(login_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.deactivate_admin_user(login_id, actor_employment_id=actor)


@router.post("/users/{login_id}/activate", response_model=MessageResponse)
async def activate_user(login_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.activate_admin_user(login_id, actor_employment_id=actor)


@router.post("/users/{login_id}/lock", response_model=MessageResponse)
async def lock_user(login_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.lock_admin_user(login_id, actor_employment_id=actor)


@router.post("/users/{login_id}/unlock", response_model=MessageResponse)
async def unlock_user(login_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.unlock_admin_user(login_id, actor_employment_id=actor)


@router.post("/users/{login_id}/archive", response_model=MessageResponse)
async def archive_user(login_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive_admin_user(login_id, actor_employment_id=actor)


@router.delete("/users/{login_id}", response_model=MessageResponse)
async def delete_user(login_id: int, service: OrganizationServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive_admin_user(login_id, actor_employment_id=actor)
