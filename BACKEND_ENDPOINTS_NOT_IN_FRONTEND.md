# Backend Endpoints NOT Available in Frontend

**Generated:** September 6, 2026  
**Source:** Backend `API_ENDPOINTS.json` (189 endpoints) vs Frontend API calls analysis

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Backend Endpoints | 189 |
| Endpoints Used by Frontend | ~85 |
| **Endpoints NOT in Frontend** | **~104** |
| Completely Unused Modules | 2 (Audit, Notes & Documents) |

---

## 🔴 Completely Unused Modules (Zero Frontend Calls)

### 1. Audit Module (4 endpoints)
| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| POST | `/api/v1/audit/logs` | create_log | Create audit log entry |
| GET | `/api/v1/audit/logs` | list_logs | List audit logs with filters |
| GET | `/api/v1/audit/logs/{log_id}` | get_log | Get single audit log detail |
| POST | `/api/v1/audit/archive` | archive_old_logs | Archive old audit logs |

### 2. Notes & Documents Module (15 endpoints)
| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| POST | `/api/v1/notes-documents/notes` | create_note | Create a note |
| GET | `/api/v1/notes-documents/notes` | list_notes | List notes |
| GET | `/api/v1/notes-documents/notes/{note_id}` | get_note | Get note detail |
| PATCH | `/api/v1/notes-documents/notes/{note_id}` | update_note | Update note |
| POST | `/api/v1/notes-documents/document-types` | create_document_type | Create document type |
| GET | `/api/v1/notes-documents/document-types` | list_document_types | List document types |
| PATCH | `/api/v1/notes-documents/document-types/{type_id}` | update_document_type | Update document type |
| POST | `/api/v1/notes-documents/document-types/{type_id}/archive` | archive_document_type | Archive document type |
| POST | `/api/v1/notes-documents/documents` | create_document | Create document |
| GET | `/api/v1/notes-documents/documents/{document_id}` | get_document | Get document detail |
| POST | `/api/v1/notes-documents/documents/{document_id}/versions` | add_version | Add document version |
| POST | `/api/v1/notes-documents/documents/{document_id}/archive` | archive_document | Archive document |
| POST | `/api/v1/notes-documents/links` | link_document | Link document to entity |
| GET | `/api/v1/notes-documents/links/by-entity` | list_links_for_entity | List links for entity |
| GET | `/api/v1/notes-documents/documents/{document_id}/links` | list_links_for_document | List links for document |

---

## 🟡 Partially Used Modules (Backend has more endpoints than Frontend uses)

### 3. RBAC Module (18 total, 7 used, **11 unused**)

**Used by Frontend:** GET/POST/PATCH/DELETE `/rbac/roles*`, GET `/rbac/resources`, GET `/rbac/permissions`

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| GET | `/api/v1/rbac/scopes` | list_scopes | List all permission scopes | No frontend UI for scope management |
| GET | `/api/v1/rbac/sensitive-fields` | list_sensitive_fields | List sensitive field definitions | No frontend UI for field-level permissions |
| POST | `/api/v1/rbac/roles/{role_id}/permissions` | grant_permission | Grant permission to role | Frontend uses different permission model |
| DELETE | `/api/v1/rbac/roles/{role_id}/permissions/{permission_id}/scopes/{scope_id}` | revoke_permission | Revoke permission from role | Not implemented in frontend |
| POST | `/api/v1/rbac/employments/{employment_id}/roles` | assign_role | Assign role to employee | Frontend doesn't have role assignment UI |
| DELETE | `/api/v1/rbac/employments/{employment_id}/roles/{role_id}` | unassign_role | Remove role from employee | Not implemented |
| GET | `/api/v1/rbac/employments/{employment_id}/roles` | list_roles_for_employment | Get roles for employee | Not used |
| GET | `/api/v1/rbac/employments/{employment_id}/effective-permissions` | get_effective_permissions | Get computed permissions for employee | Not used |
| PUT | `/api/v1/rbac/roles/{role_id}/sensitive-fields` | set_sensitive_field_permission | Set field-level permissions | Not implemented |

---

### 4. Developer Module (14 total, ~6 used via `/projects` prefix, **8 unused**)

**Note:** Frontend accesses Developer endpoints via `/projects/*` prefix (different URL structure)

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| POST | `/api/v1/developer/time-entries` | create_time_entry | Create time entry | No time tracking UI in frontend |
| GET | `/api/v1/developer/tasks/{task_id}/time-entries` | list_time_entries | List time entries for task | Not implemented |
| POST | `/api/v1/developer/teams/{team_id}/members` | add_team_member | Add member to team | Frontend uses `/projects/teams/{id}/members` with different structure |
| DELETE | `/api/v1/developer/teams/{team_id}/members/{employment_id}` | remove_team_member | Remove member from team | Not implemented |

---

### 5. Approvals Module (9 total, 5 used, **4 unused**)

**Used:** POST/GET `/approvals/requests`, GET `/approvals/requests/{id}`, POST approve/reject

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| GET | `/api/v1/approvals/requests/by-reference/{request_type}/{reference_id}` | get_request_by_reference | Find request by reference | Frontend doesn't use reference-based lookup |
| POST | `/api/v1/approvals/requests/{request_id}/cancel` | cancel | Cancel approval request | Frontend lacks cancel action |
| POST | `/api/v1/approvals/requests/{request_id}/comment` | comment | Add comment to request | Frontend lacks comment feature |

---

### 6. Employment Module (16 total, ~6 used, **10 unused**)

**Used:** POST/GET/PATCH `/employment/employments`, GET/POST/PATCH `/employment/positions`, POST archive position

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| GET | `/api/v1/employment/employments/by-person/{person_id}` | list_employments_by_person | Get employments for person | Frontend doesn't query by person |
| POST | `/api/v1/employment/employments/{employment_id}/state` | change_state | Change employment state | State changes handled elsewhere |
| GET | `/api/v1/employment/employments/{employment_id}/state-history` | list_state_history | Get state history | Not displayed in frontend |
| POST | `/api/v1/employment/employments/{employment_id}/assignments` | create_assignment | Create assignment | Frontend uses department assign endpoint |
| GET | `/api/v1/employment/employments/{employment_id}/assignments/current` | get_current_assignment | Get current assignment | Not directly used |
| GET | `/api/v1/employment/employments/{employment_id}/assignments` | list_assignments | List all assignments | Not displayed |
| POST | `/api/v1/employment/positions/{position_id}/archive` | archive_position | Archive position | Frontend uses organization/positions archive |

---

### 7. Attendance Module (14 total, ~5 used, **9 unused**)

**Used:** GET `/attendance/days/by-employment/{id}`, GET/POST `/attendance/corrections`

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| POST | `/api/v1/attendance/punch` | punch | Punch in/out | Frontend uses mock attendance, no real punch |
| GET | `/api/v1/attendance/days/{day_id}` | get_day | Get attendance day detail | Not used |
| POST | `/api/v1/attendance/policies` | create_policy | Create attendance policy | Admin UI not built |
| GET | `/api/v1/attendance/policies` | list_policies | List attendance policies | Not displayed |
| GET | `/api/v1/attendance/policies/current` | get_current_policy | Get current policy | Not used |
| GET | `/api/v1/attendance/summaries/{employment_id}/{year}/{month}` | get_monthly_summary | Monthly attendance summary | Frontend expects different structure |
| POST | `/api/v1/attendance/summaries/{employment_id}/{year}/{month}/rebuild` | rebuild_monthly_summary | Rebuild summary | Admin action not in frontend |
| POST | `/api/v1/attendance/summaries/{employment_id}/{year}/{month}/lock` | lock_monthly_summary | Lock summary | Not implemented |
| POST | `/api/v1/attendance/breaks/start` | start_break | Start break | No break tracking UI |
| POST | `/api/v1/attendance/breaks/{break_id}/end` | end_break | End break | Not implemented |

---

### 8. Leave Module (12 total, ~5 used, **7 unused**)

**Used:** GET/POST `/leave/policies`, GET `/leave/balances/{id}`, GET/POST `/leave/requests`, GET `/leave/ledger/{id}`

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| POST | `/api/v1/leave/policies` | create_policy | Create leave policy | Admin uses organization settings |
| GET | `/api/v1/leave/policies/current/{leave_type}` | get_current_policy | Get current policy for type | Not used |
| POST | `/api/v1/leave/requests/{request_id}/cancel` | cancel_request | Cancel leave request | Frontend lacks cancel action |
| POST | `/api/v1/leave/ledger` | post_ledger_entry | Post ledger entry | Not implemented in frontend |

---

### 9. Organization Module (25 total, ~18 used, **7 unused**)

**Used:** Most CRUD operations for departments, locations, shifts, working-weeks, holiday-calendars, holidays, positions

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| POST | `/api/v1/organization/departments/{department_id}/archive` | archive_department | Archive department | Frontend uses PATCH isArchived instead |
| POST | `/api/v1/organization/holiday-calendars/{calendar_id}/archive` | archive_holiday_calendar | Archive holiday calendar | Uses PATCH is_archived |
| POST | `/api/v1/organization/locations/{location_id}/archive` | archive_location | Archive location | Uses PATCH is_archived |
| GET | `/api/v1/organization/working-weeks/current` | get_current_working_week | Get current working week | Not directly used |

---

### 10. Payroll Module (14 total, ~7 used, **7 unused**)

**Note:** Major path structure mismatch - Backend uses `/payroll/salaries/{employment_id}`, Frontend expects `/payroll/employees/{id}/salary`

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| POST | `/api/v1/payroll/salaries` | create_salary | Create salary record | Frontend uses PUT /employees/{id}/salary |
| POST | `/api/v1/payroll/calculate` | calculate_payroll | Calculate payroll run | Frontend has separate run/preview/checks |
| POST | `/api/v1/payroll/{payroll_id}/approve` | approve_payroll | Approve payroll run | Frontend uses /employees/{id}/approve |
| POST | `/api/v1/payroll/bank-accounts` | add_bank_account | Add bank account | No bank account UI in frontend |
| GET | `/api/v1/payroll/bank-accounts/{employment_id}` | list_bank_accounts | List bank accounts | Not implemented |
| GET | `/api/v1/payroll/bank-accounts/{employment_id}/primary` | get_primary_bank | Get primary bank account | Not implemented |

---

### 11. Sales Module (12 total, ~8 used, **4 unused**)

**Used:** Leads CRUD, Clients CRUD

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| POST | `/api/v1/sales/contacts` | add_contact | Add client contact | Frontend doesn't manage contacts separately |
| GET | `/api/v1/sales/clients/{client_id}/contacts` | list_contacts | List client contacts | Not displayed |
| POST | `/api/v1/sales/platforms` | create_platform | Create platform | No platform management UI |
| GET | `/api/v1/sales/platforms` | list_platforms | List platforms | Not used |
| PATCH | `/api/v1/sales/platforms/{platform_id}` | update_platform | Update platform | Not implemented |
| POST | `/api/v1/sales/platforms/{platform_id}/archive` | archive_platform | Archive platform | Not implemented |
| POST | `/api/v1/sales/leads/{lead_id}/status` | change_lead_status | Change lead status | Frontend uses PATCH lead directly |

---

### 12. Authentication Module (7 total, 6 used, **1 unused**)

**Used:** All auth flows (login, logout, refresh, forgot/reset/change password)

| Method | Path | Operation | Description | Why Unused |
|--------|------|-----------|-------------|------------|
| GET | `/api/v1/auth/sessions` | list_sessions | List user sessions | Frontend uses `/profile/sessions` instead |

---

## 📊 Summary by Module

| Module | Total | Used | Unused | % Unused |
|--------|-------|------|--------|----------|
| **Audit** | 4 | 0 | **4** | 100% |
| **Notes & Documents** | 15 | 0 | **15** | 100% |
| **RBAC** | 18 | 7 | **11** | 61% |
| **Developer** | 14 | 6 | **8** | 57% |
| **Attendance** | 14 | 5 | **9** | 64% |
| **Employment** | 16 | 6 | **10** | 63% |
| **Leave** | 12 | 5 | **7** | 58% |
| **Approvals** | 9 | 5 | **4** | 44% |
| **Organization** | 25 | 18 | **7** | 28% |
| **Payroll** | 14 | 7 | **7** | 50% |
| **Sales** | 12 | 8 | **4** | 33% |
| **Authentication** | 7 | 6 | **1** | 14% |
| **TOTAL** | **189** | **~85** | **~104** | **55%** |

---

## 🔑 Key Findings

### 1. Two Entire Modules Orphaned
- **Audit** (4 endpoints) - No frontend integration at all
- **Notes & Documents** (15 endpoints) - No frontend integration at all

### 2. RBAC Severely Underutilized
Only role CRUD is wired up. The entire permission assignment system (grant/revoke permissions, role-employee mapping, effective permissions, sensitive fields) is backend-only.

### 3. Developer Time-Tracking Missing
Time entries and team member management exist in backend but frontend has no time tracking feature.

### 4. Attendance Core Features Missing
Punch in/out, break tracking, attendance policies, monthly summaries, and locking - all backend-only.

### 5. Payroll Path Mismatch
Backend: `/payroll/salaries/{employment_id}`  
Frontend expects: `/payroll/employees/{id}/salary`  
This causes 7 endpoints to be effectively unused.

### 6. Archive Pattern Inconsistency
Backend uses POST `/archive` endpoints; Frontend uses PATCH with `isArchived` flag. Results in duplicate/unused archive endpoints.

---

## 🎯 Recommended Actions

### Priority 1: Remove or Document Orphaned Endpoints
- [ ] Decide if Audit module should have frontend (admin audit trail)
- [ ] Decide if Notes & Documents should have frontend (document management)
- [ ] If not needed, consider removing from backend API surface

### Priority 2: Wire Up High-Value Unused Endpoints
- [ ] RBAC: Role assignment to employees, permission management
- [ ] Attendance: Punch in/out, break tracking
- [ ] Payroll: Bank accounts, salary creation
- [ ] Developer: Time entries

### Priority 3: Align URL Patterns
- [ ] Standardize on either `/payroll/salaries/` or `/payroll/employees/`
- [ ] Standardize archive pattern (POST /archive vs PATCH isArchived)
- [ ] Align Developer `/projects` prefix with backend `/developer`

### Priority 4: Clean Up Duplicate Patterns
- [ ] Consolidate archive endpoints
- [ ] Remove unused Sales platform/contact endpoints if not needed
- [ ] Remove unused Employment assignment endpoints if covered by department API

---

*This analysis compares `02_backend_code/API_ENDPOINTS.json` against all frontend API files in `01_frontend_code/src/modules/*/api/*.ts`*