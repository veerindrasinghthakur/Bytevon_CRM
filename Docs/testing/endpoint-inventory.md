# Endpoint Inventory (HISTORICAL — SUPERSEDED)

> Authoritative source is now generated `endpoint_inventory.json` (TASK-001, from the running app).
> Counts below (historical static discovery: 274+ across 62 routes.py files) are illustrative only.

## Historical static discovery: 274+ across 62 routes.py files

## Grouped by Module

### auth (7 endpoints)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| AUTH-001 | POST | /auth/login | LoginRequest | LoginResponse | Public |
| AUTH-002 | POST | /auth/refresh | RefreshRequest | TokenPairResponse | Public |
| AUTH-003 | POST | /auth/logout | MessageResponse | MessageResponse | Bearer |
| AUTH-004 | POST | /auth/change-password | ChangePasswordRequest | MessageResponse | Bearer (X-Login-Id) |
| AUTH-005 | POST | /auth/forgot-password | ForgotPasswordRequest | MessageResponse | Public |
| AUTH-006 | POST | /auth/reset-password | ResetPasswordRequest | MessageResponse | Public |
| AUTH-007 | GET | /auth/sessions | N/A | list[SessionResponse] | Bearer |

### workforce/employee (15 endpoints)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| WF-EMP-001 | POST | /workforce/persons | PersonCreate | PersonResponse | Bearer (X-Employment-Id) |
| WF-EMP-002 | GET | /workforce/persons | query: limit, offset | list[PersonResponse] | Bearer |
| WF-EMP-003 | GET | /workforce/persons/{person_id} | N/A | PersonResponse | Bearer |
| WF-EMP-004 | PATCH | /workforce/persons/{person_id} | PersonUpdate | PersonResponse | Bearer (X-Employment-Id) |
| WF-EMP-005 | POST | /workforce/positions | PositionCreate | PositionResponse | Bearer (X-Employment-Id) |
| WF-EMP-006 | GET | /workforce/positions | query: include_archived | list[PositionResponse] | Bearer |
| WF-EMP-007 | GET | /workforce/positions/{position_id} | N/A | PositionResponse | Bearer |
| WF-EMP-008 | PATCH | /workforce/positions/{position_id} | PositionUpdate | PositionResponse | Bearer (X-Employment-Id) |
| WF-EMP-009 | POST | /workforce/positions/{position_id}/archive | MessageResponse | MessageResponse | Bearer (X-Employment-Id) |
| WF-EMP-010 | POST | /workforce/employees | EmployeeCreate | EmploymentDetailResponse | Bearer (X-Employment-Id) |
| WF-EMP-011 | POST | /workforce/employments | EmploymentCreate | EmploymentDetailResponse | Bearer (X-Employment-Id) |
| WF-EMP-012 | GET | /workforce/employments | query: state, limit, offset | list[EmploymentResponse] | Bearer |
| WF-EMP-013 | GET | /workforce/employments/by-person/{person_id} | N/A | list[EmploymentResponse] | Bearer |
| WF-EMP-014 | GET | /workforce/employments/{employment_id} | N/A | EmploymentDetailResponse | Bearer |
| WF-EMP-015 | PATCH | /workforce/employments/{employment_id} | EmploymentUpdate | EmploymentResponse | Bearer (X-Employment-Id) |

### workforce/attendance (10 endpoints)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| WF-ATT-001 | POST | /workforce/attendance/punch | PunchRequest | PunchResponse | Bearer (X-Employment-Id) |
| WF-ATT-002 | GET | /workforce/attendance/days/{day_id} | N/A | AttendanceDayDetailResponse | Bearer |
| WF-ATT-003 | GET | /workforce/attendance/days/by-employment/{employment_id} | query: from_date, to_date | list[AttendanceDayResponse] | Bearer |
| WF-ATT-004 | POST | /workforce/attendance/corrections | CorrectionCreate | CorrectionResponse | Bearer (X-Employment-Id) |
| WF-ATT-005 | GET | /workforce/attendance/corrections/{correction_id} | N/A | CorrectionResponse | Bearer |
| WF-ATT-006 | GET | /workforce/attendance/summaries/{employment_id}/{year}/{month} | N/A | MonthlySummaryResponse | Bearer |
| WF-ATT-007 | POST | /workforce/attendance/summaries/{employment_id}/{year}/{month}/rebuild | N/A | MonthlySummaryResponse | Bearer (X-Employment-Id) |
| WF-ATT-008 | POST | /workforce/attendance/summaries/{employment_id}/{year}/{month}/lock | N/A | MonthlySummaryResponse | Bearer (X-Employment-Id) |
| WF-ATT-009 | POST | /workforce/attendance/breaks/start | BreakStartRequest | BreakResponse | Bearer (X-Employment-Id) |
| WF-ATT-010 | POST | /workforce/attendance/breaks/{break_id}/end | BreakEndRequest | BreakResponse | Bearer (X-Employment-Id) |

### my-work/attendance (9 endpoints)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| MW-ATT-001 | POST | /my-work/attendance/punch | PunchRequest | PunchResponse | X-Employment-Id |
| MW-ATT-002 | POST | /my-work/attendance/breaks/start | BreakStartRequest | BreakResponse | X-Employment-Id |
| MW-ATT-003 | POST | /my-work/attendance/breaks/{break_id}/end | BreakEndRequest | BreakResponse | X-Employment-Id |
| MW-ATT-004 | GET | /my-work/attendance/days | AttendanceDayResponse | X-Employment-Id |
| MW-ATT-005 | GET | /my-work/attendance/today-info | TodayInfoResponse | X-Employment-Id |
| MW-ATT-006 | GET | /my-work/attendance/week-hours | WeekHoursResponse | X-Employment-Id |
| MW-ATT-007 | GET | /my-work/attendance/corrections | CorrectionListResponse | X-Employment-Id |
| MW-ATT-008 | GET | /my-work/attendance/correction-candidates | list[CorrectionCandidate] | X-Employment-Id |
| MW-ATT-009 | GET | /my-work/attendance/approvers | list[ApproverOption] | X-Employment-Id |

### my-work/leave (4 endpoints)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| MW-LEAVE-001 | GET | /my-work/leave/ | query: employment_id, status, search, page, pageSize | LeaveListResponse | Query |
| MW-LEAVE-002 | GET | /my-work/leave/balances | query: employment_id | list[LeaveBalance] | Query |
| MW-LEAVE-003 | GET | /my-work/leave/types | N/A | list[LeaveTypeOption] | Query |
| MW-LEAVE-004 | POST | /my-work/leave/ | CreateLeaveRequestInput | LeaveRequest | Query (optional employment_id) |

### my-work/tasks (1 endpoint)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| MW-TASKS-001 | GET | /my-work/tasks | query: employment_id, status, search, page, pageSize | MyTaskListResponse | Query |

### my-work/requests (1 endpoint)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| MW-REQ-001 | GET | /my-work/requests/ | query: employment_id, status, search | RequestListResponse | Query |

### my-work/approvals (1 endpoint)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| MW-APP-001 | GET | /my-work/approvals/ | N/A | list[dict] | Query |

### my-work/profile (4 endpoints)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| MW-PROF-001 | GET | /profile/me | query: x_login_id, x_employment_id | ProfileMeResponse | Optional headers |
| MW-PROF-002 | PATCH | /profile/me | dict[str, Any] | dict[str, Any] | Optional |
| MW-PROF-003 | GET | /profile/activity | query: limit | ProfileActivityResponse | Optional |
| MW-PROF-004 | GET | /profile/sessions | auth: AuthenticationServiceDep | list[Any] | Bearer |

### admin/user (11 endpoints)
| Endpoint ID | Method | Path | Request Body | Response | Auth Requirement |
|-------------|--------|------|--------------|----------|-----------------|
| ADM-USER-001 | GET | /admin/users | query: search, status, department, role, page, pageSize | AdminUserListResponse | Bearer (X-Employment-Id) |
| ADM-USER-002 | GET | /admin/employments-without-login | N/A | list[EmploymentWithoutLogin] | Public |
| ADM-USER-003 | GET | /admin/users/{login_id} | N/A | AdminUserDetailResponse | Bearer |
| ADM-USER-004 | POST | /admin/users | AdminUserCreate | AdminUserDetailResponse | Bearer (X-Employment-Id) |
| ADM-USER-005 | PATCH | /admin/users/{login_id} | AdminUserUpdate | AdminUserDetailResponse | Bearer (X-Employment-Id) |
| ADM-USER-006 | POST | /admin/users/{login_id}/deactivate | MessageResponse | MessageResponse | Bearer (X-Employment-Id) |
| ADM-USER-007 | POST | /admin/users/{login_id}/activate | MessageResponse | MessageResponse | Bearer (X-Employment-Id) |
| ADM-USER-008 | POST | /admin/users/{login_id}/lock | MessageResponse | MessageResponse | Bearer (X-Employment- Id) |
| 
@router.post("/users/{login_id}/unlock", response_model=MessageResponse)
async def unlock_user(
    login_id: int, service: ServiceDep, actor: ActorHeader = None
) -> MessageResponse:
    return await service.unlock_admin_user(login_id, actor_employment_id=actor)

 @router.post("/users/{login_id}/archive", response_model=MessageResponse)
 async def archive_user(
     login_id: int, service: ServiceDep, actor: ActorHeader = None
 ) -> MessageResponse:
     return await service.archive_admin_user(login_id, actor_employment_id=actor)
 
 @router.delete("/users/{login_id}", response_model=MessageResponse)
 async def delete_user(
     login_id: int, service: ServiceDep, actor: ActorHeader = None
 ) -> MessageResponse:
     return await service.archive_admin_user(login_id, actor_employment_id=actor)
 
 (End of file - total 118 lines)

The following endpoints exist in admin/user/routes.py:
- GET /users
- GET /employments-without-login
- GET /users/{login_id}
- POST /users
- PATCH /users/{login_id}
- POST /users/{login_id}/deactivate
- POST /users/{login_id}/activate
- POST /users/{login_id}/lock
- POST /users/{login_id}/unlock
- POST /users/{login_id}/archive
- delete /users/{login_id}

All require ActorHeader (X-Employment-Id) except list_employments_without_login which is public.