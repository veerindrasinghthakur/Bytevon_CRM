# ByteVon CRM — Frontend API Reference

Base URL: `{API_HOST}/api/v1`  
Interactive docs: `{API_HOST}/docs` (Swagger) / `{API_HOST}/redoc`

## Conventions

| Item | Detail |
|------|--------|
| Content-Type | `application/json` |
| Auth | `Authorization: Bearer <access_token>` after login |
| Actor (optional) | `X-Employment-Id: <int>` when JWT lacks employment or for multi-emp |
| Access token TTL | ~5–10 minutes (config) |
| Refresh token | Use `POST /auth/refresh` with refresh token body |
| Errors | JSON `{ "detail": "..." }` or structured domain error |
| IDs | Integer path params |

### Auth flow (frontend)

```
1. POST /api/v1/auth/login  { email, password }
   → { access_token, refresh_token, login_id, person_id, employment_id?, ... }
2. Store tokens; send Authorization: Bearer <access_token> on API calls
3. On 401 → POST /api/v1/auth/refresh  { refresh_token } → new access (+ refresh)
4. POST /api/v1/auth/logout  (invalidate session)
```

### Cross-module wiring (backend)

- **Sales Lead WON** → creates Client → optional **Developer** `create_from_lead` → **Notification** to assignee
- **Leave / Attendance corrections** → **Approvals** create request; decision event → local status + ledger/day rebuild
- **Payroll PAID** → **Attendance** monthly summary lock
- All significant actions → **Audit** via post-commit `BasePublicService._audit`
- Prefer **Public Services** only; never call another module’s repository

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness `{ status, app }` |

## Authentication

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/auth/login` | `login` | `LoginResponse` |
| `POST` | `/api/v1/auth/refresh` | `refresh` | `TokenPairResponse` |
| `POST` | `/api/v1/auth/logout` | `logout` | `MessageResponse` |
| `POST` | `/api/v1/auth/change-password` | `change_password` | `MessageResponse` |
| `POST` | `/api/v1/auth/forgot-password` | `forgot_password` | `MessageResponse` |
| `POST` | `/api/v1/auth/reset-password` | `reset_password` | `MessageResponse` |
| `GET` | `/api/v1/auth/sessions` | `list_sessions` | `list[SessionResponse]` |

## Organization

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/organization/departments` | `create_department` | `DepartmentResponse` |
| `GET` | `/api/v1/organization/departments` | `list_departments` | `list[DepartmentResponse]` |
| `GET` | `/api/v1/organization/departments/{department_id}` | `get_department` | `DepartmentResponse` |
| `PATCH` | `/api/v1/organization/departments/{department_id}` | `update_department` | `DepartmentResponse` |
| `POST` | `/api/v1/organization/departments/{department_id}/archive` | `archive_department` | `MessageResponse` |
| `POST` | `/api/v1/organization/working-weeks` | `create_working_week` | `WorkingWeekResponse` |
| `GET` | `/api/v1/organization/working-weeks` | `list_working_weeks` | `list[WorkingWeekResponse]` |
| `GET` | `/api/v1/organization/working-weeks/current` | `get_current_working_week` | `WorkingWeekResponse` |
| `GET` | `/api/v1/organization/working-weeks/{week_id}` | `get_working_week` | `WorkingWeekResponse` |
| `POST` | `/api/v1/organization/shifts` | `create_shift` | `ShiftResponse` |
| `GET` | `/api/v1/organization/shifts` | `list_shifts` | `list[ShiftResponse]` |
| `GET` | `/api/v1/organization/shifts/{shift_id}` | `get_shift` | `ShiftResponse` |
| `PATCH` | `/api/v1/organization/shifts/{shift_id}` | `update_shift` | `ShiftResponse` |
| `POST` | `/api/v1/organization/shifts/{shift_id}/archive` | `archive_shift` | `MessageResponse` |
| `POST` | `/api/v1/organization/holiday-calendars` | `create_holiday_calendar` | `HolidayCalendarResponse` |
| `GET` | `/api/v1/organization/holiday-calendars` | `list_holiday_calendars` | `list[HolidayCalendarResponse]` |
| `GET` | `/api/v1/organization/holiday-calendars/{calendar_id}` | `get_holiday_calendar` | `HolidayCalendarResponse` |
| `PATCH` | `/api/v1/organization/holiday-calendars/{calendar_id}` | `update_holiday_calendar` | `HolidayCalendarResponse` |
| `POST` | `/api/v1/organization/holiday-calendars/{calendar_id}/archive` | `archive_holiday_calendar` | `MessageResponse` |
| `POST` | `/api/v1/organization/holidays` | `add_holiday` | `HolidayResponse` |
| `GET` | `/api/v1/organization/holiday-calendars/{calendar_id}/holidays` | `list_holidays` | `list[HolidayResponse]` |
| `POST` | `/api/v1/organization/locations` | `create_location` | `LocationResponse` |
| `GET` | `/api/v1/organization/locations` | `list_locations` | `list[LocationResponse]` |
| `GET` | `/api/v1/organization/locations/{location_id}` | `get_location` | `LocationResponse` |
| `PATCH` | `/api/v1/organization/locations/{location_id}` | `update_location` | `LocationResponse` |
| `POST` | `/api/v1/organization/locations/{location_id}/archive` | `archive_location` | `MessageResponse` |
| `GET` | `/api/v1/organization/settings` | `get_organization_settings` | `OrganizationSettingsResponse` |
| `PUT` | `/api/v1/organization/settings` | `upsert_organization_settings` | `OrganizationSettingsResponse` |

## Employment

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/employment/positions` | `create_position` | `PositionResponse` |
| `GET` | `/api/v1/employment/positions` | `list_positions` | `list[PositionResponse]` |
| `GET` | `/api/v1/employment/positions/{position_id}` | `get_position` | `PositionResponse` |
| `PATCH` | `/api/v1/employment/positions/{position_id}` | `update_position` | `PositionResponse` |
| `POST` | `/api/v1/employment/positions/{position_id}/archive` | `archive_position` | `MessageResponse` |
| `POST` | `/api/v1/employment/employments` | `create_employment` | `EmploymentDetailResponse` |
| `GET` | `/api/v1/employment/employments` | `list_employments` | `list[EmploymentResponse]` |
| `GET` | `/api/v1/employment/employments/by-person/{person_id}` | `list_employments_by_person` | `list[EmploymentResponse]` |
| `GET` | `/api/v1/employment/employments/{employment_id}` | `get_employment` | `EmploymentDetailResponse` |
| `PATCH` | `/api/v1/employment/employments/{employment_id}` | `update_employment` | `EmploymentResponse` |
| `POST` | `/api/v1/employment/employments/{employment_id}/state` | `change_state` | `EmploymentStateHistoryResponse` |
| `GET` | `/api/v1/employment/employments/{employment_id}/state-history` | `list_state_history` | `list[EmploymentStateHistoryResponse]` |
| `POST` | `/api/v1/employment/employments/{employment_id}/assignments` | `create_assignment` | `EmploymentAssignmentResponse` |
| `GET` | `/api/v1/employment/employments/{employment_id}/assignments/current` | `get_current_assignment` | `EmploymentAssignmentResponse` |
| `GET` | `/api/v1/employment/employments/{employment_id}/assignments` | `list_assignments` | `list[EmploymentAssignmentResponse]` |

## RBAC

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `GET` | `/api/v1/rbac/resources` | `list_resources` | `list[ResourceResponse]` |
| `GET` | `/api/v1/rbac/permissions` | `list_permissions` | `list[PermissionResponse]` |
| `GET` | `/api/v1/rbac/scopes` | `list_scopes` | `list[ScopeResponse]` |
| `GET` | `/api/v1/rbac/sensitive-fields` | `list_sensitive_fields` | `list[SensitiveFieldResponse]` |
| `POST` | `/api/v1/rbac/roles` | `create_role` | `RoleResponse` |
| `GET` | `/api/v1/rbac/roles` | `list_roles` | `list[RoleResponse]` |
| `GET` | `/api/v1/rbac/roles/{role_id}` | `get_role` | `RoleDetailResponse` |
| `PATCH` | `/api/v1/rbac/roles/{role_id}` | `update_role` | `RoleResponse` |
| `DELETE` | `/api/v1/rbac/roles/{role_id}` | `delete_role` | `MessageResponse` |
| `POST` | `/api/v1/rbac/roles/{role_id}/permissions` | `grant_permission` | `RolePermissionResponse` |
| `DELETE` | `/api/v1/rbac/roles/{role_id}/permissions/{permission_id}/scopes/{scope_id}` | `revoke_permission` | `MessageResponse` |
| `POST` | `/api/v1/rbac/employments/{employment_id}/roles` | `assign_role` | `EmployeeRoleResponse` |
| `DELETE` | `/api/v1/rbac/employments/{employment_id}/roles/{role_id}` | `unassign_role` | `MessageResponse` |
| `GET` | `/api/v1/rbac/employments/{employment_id}/roles` | `list_roles_for_employment` | `list[EmployeeRoleResponse]` |
| `GET` | `/api/v1/rbac/employments/{employment_id}/effective-permissions` | `get_effective_permissions` | `EffectivePermissionsResponse` |
| `PUT` | `/api/v1/rbac/roles/{role_id}/sensitive-fields` | `set_sensitive_field_permission` | `RoleSensitiveFieldPermissionResponse` |

## Approvals

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/approvals/requests` | `create_request` | `ApprovalRequestResponse` |
| `GET` | `/api/v1/approvals/requests` | `list_requests` | `list[ApprovalRequestResponse]` |
| `GET` | `/api/v1/approvals/requests/{request_id}` | `get_request` | `ApprovalRequestDetailResponse` |
| `GET` | `/api/v1/approvals/requests/by-reference/{request_type}/{reference_id}` | `get_request_by_reference` | `ApprovalRequestDetailResponse` |
| `POST` | `/api/v1/approvals/requests/{request_id}/approve` | `approve` | `ApprovalRequestDetailResponse` |
| `POST` | `/api/v1/approvals/requests/{request_id}/reject` | `reject` | `ApprovalRequestDetailResponse` |
| `POST` | `/api/v1/approvals/requests/{request_id}/cancel` | `cancel` | `ApprovalRequestDetailResponse` |
| `POST` | `/api/v1/approvals/requests/{request_id}/comment` | `comment` | `ApprovalActionResponse` |

## Leave

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/leave/policies` | `create_policy` | `LeavePolicyResponse` |
| `GET` | `/api/v1/leave/policies` | `list_policies` | `list[LeavePolicyResponse]` |
| `GET` | `/api/v1/leave/policies/current/{leave_type}` | `get_current_policy` | `LeavePolicyResponse` |
| `POST` | `/api/v1/leave/requests` | `submit_request` | `LeaveRequestResponse` |
| `GET` | `/api/v1/leave/requests` | `list_requests` | `list[LeaveRequestResponse]` |
| `GET` | `/api/v1/leave/requests/{request_id}` | `get_request` | `LeaveRequestResponse` |
| `POST` | `/api/v1/leave/requests/{request_id}/cancel` | `cancel_request` | `LeaveRequestResponse` |
| `POST` | `/api/v1/leave/ledger` | `post_ledger_entry` | `LeaveLedgerResponse` |
| `GET` | `/api/v1/leave/ledger/{employment_id}` | `list_ledger` | `list[LeaveLedgerResponse]` |
| `GET` | `/api/v1/leave/balances/{employment_id}` | `get_balances` | `LeaveBalanceResponse` |

## Attendance

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/attendance/punch` | `punch` | `PunchResponse` |
| `GET` | `/api/v1/attendance/days/{day_id}` | `get_day` | `AttendanceDayDetailResponse` |
| `GET` | `/api/v1/attendance/days/by-employment/{employment_id}` | `list_days` | `list[AttendanceDayResponse]` |
| `POST` | `/api/v1/attendance/corrections` | `submit_correction` | `CorrectionResponse` |
| `GET` | `/api/v1/attendance/corrections/{correction_id}` | `get_correction` | `CorrectionResponse` |
| `POST` | `/api/v1/attendance/policies` | `create_policy` | `AttendancePolicyResponse` |
| `GET` | `/api/v1/attendance/policies` | `list_policies` | `list[AttendancePolicyResponse]` |
| `GET` | `/api/v1/attendance/policies/current` | `get_current_policy` | `AttendancePolicyResponse` |
| `GET` | `/api/v1/attendance/summaries/{employment_id}/{year}/{month}` | `get_monthly_summary` | `MonthlySummaryResponse` |
| `POST` | `/api/v1/attendance/summaries/{employment_id}/{year}/{month}/rebuild` | `rebuild_monthly_summary` | `MonthlySummaryResponse` |
| `POST` | `/api/v1/attendance/summaries/{employment_id}/{year}/{month}/lock` | `lock_monthly_summary` | `MonthlySummaryResponse` |
| `POST` | `/api/v1/attendance/breaks/start` | `start_break` | `BreakResponse` |
| `POST` | `/api/v1/attendance/breaks/{break_id}/end` | `end_break` | `BreakResponse` |

## Notifications

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/notifications/templates` | `create_template` | `NotificationTemplateResponse` |
| `GET` | `/api/v1/notifications/templates` | `list_templates` | `list[NotificationTemplateResponse]` |
| `GET` | `/api/v1/notifications/templates/{template_id}` | `get_template` | `NotificationTemplateResponse` |
| `PATCH` | `/api/v1/notifications/templates/{template_id}` | `update_template` | `NotificationTemplateResponse` |
| `POST` | `/api/v1/notifications/notify` | `notify` | `Optional[NotificationResponse]` |
| `POST` | `/api/v1/notifications/notify/bulk` | `notify_bulk` | `list[NotificationResponse]` |
| `GET` | `/api/v1/notifications/inbox` | `list_inbox` | `list[NotificationResponse]` |
| `GET` | `/api/v1/notifications/inbox/unread-count` | `unread_count` | `—` |
| `POST` | `/api/v1/notifications/inbox/{notification_id}/read` | `mark_read` | `NotificationResponse` |
| `POST` | `/api/v1/notifications/inbox/{notification_id}/archive` | `archive` | `NotificationResponse` |
| `GET` | `/api/v1/notifications/preferences` | `list_preferences` | `list[PreferenceResponse]` |
| `PUT` | `/api/v1/notifications/preferences` | `set_preference` | `PreferenceResponse` |

## Sales

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/sales/clients` | `create_client` | `ClientResponse` |
| `GET` | `/api/v1/sales/clients` | `list_clients` | `list[ClientResponse]` |
| `GET` | `/api/v1/sales/clients/{client_id}` | `get_client` | `ClientResponse` |
| `PATCH` | `/api/v1/sales/clients/{client_id}` | `update_client` | `ClientResponse` |
| `POST` | `/api/v1/sales/clients/{client_id}/archive` | `archive_client` | `MessageResponse` |
| `POST` | `/api/v1/sales/contacts` | `add_contact` | `ClientContactResponse` |
| `GET` | `/api/v1/sales/clients/{client_id}/contacts` | `list_contacts` | `list[ClientContactResponse]` |
| `POST` | `/api/v1/sales/platforms` | `create_platform` | `PlatformResponse` |
| `GET` | `/api/v1/sales/platforms` | `list_platforms` | `list[PlatformResponse]` |
| `PATCH` | `/api/v1/sales/platforms/{platform_id}` | `update_platform` | `PlatformResponse` |
| `POST` | `/api/v1/sales/platforms/{platform_id}/archive` | `archive_platform` | `MessageResponse` |
| `POST` | `/api/v1/sales/leads` | `create_lead` | `LeadResponse` |
| `GET` | `/api/v1/sales/leads` | `list_leads` | `list[LeadResponse]` |
| `GET` | `/api/v1/sales/leads/{lead_id}` | `get_lead` | `LeadResponse` |
| `PATCH` | `/api/v1/sales/leads/{lead_id}` | `update_lead` | `LeadResponse` |
| `POST` | `/api/v1/sales/leads/{lead_id}/status` | `change_lead_status` | `Union[LeadResponse` |

## Developer

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/developer/teams` | `create_team` | `TeamResponse` |
| `GET` | `/api/v1/developer/teams` | `list_teams` | `list[TeamResponse]` |
| `GET` | `/api/v1/developer/teams/{team_id}` | `get_team` | `TeamResponse` |
| `PATCH` | `/api/v1/developer/teams/{team_id}` | `update_team` | `TeamResponse` |
| `POST` | `/api/v1/developer/teams/{team_id}/members` | `add_team_member` | `TeamMemberResponse` |
| `DELETE` | `/api/v1/developer/teams/{team_id}/members/{employment_id}` | `remove_team_member` | `MessageResponse` |
| `GET` | `/api/v1/developer/teams/{team_id}/members` | `list_team_members` | `list[TeamMemberResponse]` |
| `POST` | `/api/v1/developer/projects` | `create_project` | `ProjectResponse` |
| `GET` | `/api/v1/developer/projects` | `list_projects` | `list[ProjectResponse]` |
| `GET` | `/api/v1/developer/projects/{project_id}` | `get_project` | `ProjectResponse` |
| `PATCH` | `/api/v1/developer/projects/{project_id}` | `update_project` | `ProjectResponse` |
| `POST` | `/api/v1/developer/tasks` | `create_task` | `TaskResponse` |
| `GET` | `/api/v1/developer/projects/{project_id}/tasks` | `list_tasks` | `list[TaskResponse]` |
| `GET` | `/api/v1/developer/tasks/{task_id}` | `get_task` | `TaskResponse` |
| `PATCH` | `/api/v1/developer/tasks/{task_id}` | `update_task` | `TaskResponse` |
| `POST` | `/api/v1/developer/time-entries` | `create_time_entry` | `TimeEntryResponse` |
| `GET` | `/api/v1/developer/tasks/{task_id}/time-entries` | `list_time_entries` | `list[TimeEntryResponse]` |

## Notes & Documents

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/notes-documents/notes` | `create_note` | `NoteResponse` |
| `GET` | `/api/v1/notes-documents/notes` | `list_notes` | `list[NoteResponse]` |
| `GET` | `/api/v1/notes-documents/notes/{note_id}` | `get_note` | `NoteResponse` |
| `PATCH` | `/api/v1/notes-documents/notes/{note_id}` | `update_note` | `NoteResponse` |
| `POST` | `/api/v1/notes-documents/document-types` | `create_document_type` | `DocumentTypeResponse` |
| `GET` | `/api/v1/notes-documents/document-types` | `list_document_types` | `list[DocumentTypeResponse]` |
| `PATCH` | `/api/v1/notes-documents/document-types/{type_id}` | `update_document_type` | `DocumentTypeResponse` |
| `POST` | `/api/v1/notes-documents/document-types/{type_id}/archive` | `archive_document_type` | `MessageResponse` |
| `POST` | `/api/v1/notes-documents/documents` | `create_document` | `DocumentDetailResponse` |
| `GET` | `/api/v1/notes-documents/documents/{document_id}` | `get_document` | `DocumentDetailResponse` |
| `POST` | `/api/v1/notes-documents/documents/{document_id}/versions` | `add_version` | `DocumentVersionResponse` |
| `POST` | `/api/v1/notes-documents/documents/{document_id}/archive` | `archive_document` | `MessageResponse` |
| `POST` | `/api/v1/notes-documents/links` | `link_document` | `DocumentLinkResponse` |
| `GET` | `/api/v1/notes-documents/links/by-entity` | `list_links_for_entity` | `list[DocumentLinkResponse]` |
| `GET` | `/api/v1/notes-documents/documents/{document_id}/links` | `list_links_for_document` | `list[DocumentLinkResponse]` |

## Audit

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/audit/logs` | `create_log` | `Optional[AuditLogResponse]` |
| `GET` | `/api/v1/audit/logs` | `list_logs` | `list[AuditLogResponse]` |
| `GET` | `/api/v1/audit/logs/{log_id}` | `get_log` | `AuditLogResponse` |
| `POST` | `/api/v1/audit/archive` | `archive_old_logs` | `ArchiveResult` |

## Payroll

| Method | Path | Operation | Response |
|--------|------|-----------|----------|
| `POST` | `/api/v1/payroll/salaries` | `create_salary` | `EmployeeSalaryResponse` |
| `GET` | `/api/v1/payroll/salaries/current/{employment_id}` | `get_current_salary` | `EmployeeSalaryResponse` |
| `GET` | `/api/v1/payroll/salaries/{employment_id}` | `list_salaries` | `list[EmployeeSalaryResponse]` |
| `POST` | `/api/v1/payroll/calculate` | `calculate_payroll` | `MonthlyPayrollResponse` |
| `POST` | `/api/v1/payroll/{payroll_id}/approve` | `approve_payroll` | `MonthlyPayrollResponse` |
| `POST` | `/api/v1/payroll/{payroll_id}/pay` | `mark_paid` | `MonthlyPayrollResponse` |
| `GET` | `/api/v1/payroll/{payroll_id}` | `get_payroll` | `MonthlyPayrollResponse` |
| `GET` | `/api/v1/payroll` | `list_payrolls` | `list[MonthlyPayrollResponse]` |
| `POST` | `/api/v1/payroll/bank-accounts` | `add_bank_account` | `BankAccountResponse` |
| `GET` | `/api/v1/payroll/bank-accounts/{employment_id}` | `list_bank_accounts` | `list[BankAccountResponse]` |
| `GET` | `/api/v1/payroll/bank-accounts/{employment_id}/primary` | `get_primary_bank` | `BankAccountResponse` |

---

## Module → frontend feature map

| Frontend area | Primary API prefix |
|---------------|-------------------|
| Login / sessions | `/api/v1/auth` |
| Org structure (dept, shifts, holidays) | `/api/v1/organization` |
| Employees / positions | `/api/v1/employment` |
| Roles & permissions | `/api/v1/rbac` |
| Approvals inbox / actions | `/api/v1/approvals` |
| Leave apply / balances | `/api/v1/leave` |
| Attendance punch / corrections | `/api/v1/attendance` |
| Notification bell / prefs | `/api/v1/notifications` |
| CRM leads / clients | `/api/v1/sales` |
| Projects / tasks / time | `/api/v1/developer` |
| Notes & file links | `/api/v1/notes-documents` |
| Audit trail (admin) | `/api/v1/audit` |
| Payroll / salary | `/api/v1/payroll` |

## Suggested frontend client setup

```ts
// axios example
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL + '/api/v1' });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  const emp = localStorage.getItem('employment_id');
  if (emp) cfg.headers['X-Employment-Id'] = emp;
  return cfg;
});
```

Machine-readable list: `API_ENDPOINTS.json` in the same folder.
