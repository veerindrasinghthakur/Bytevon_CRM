# Backend Flows & Frontend Gaps Analysis Report

**Generated:** September 6, 2026  
**Scope:** Complete backend module analysis (`02_backend_code/app/modules/`) vs Frontend API calls & UI components (`01_frontend_code/src/modules/*`)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Backend Modules | 14 (all implemented) |
| Backend Endpoints | 189 total |
| Frontend Modules | 15 |
| Frontend API Calls | ~85 distinct endpoints |
| **Endpoints NOT in Frontend** | **~104 (55%)** |
| Completely Orphaned Modules | 2 (Audit, Notes & Documents) |
| Severely Underutilized Modules | RBAC (11/18), Attendance (9/14), Employment (10/16), Payroll (7/14) |

---

## Module-by-Module Flow Analysis

### 1. AUTHENTICATION MODULE
**Backend Flow:** Login → Token Pair → Refresh → Logout → Session Management → Password Flows  
**Frontend Coverage:** ✅ Complete (all 7 endpoints used)

| Backend Endpoint | Frontend Status | Notes |
|------------------|-----------------|-------|
| POST `/auth/login` | ✅ Used | `loginApi()` in auth.ts |
| POST `/auth/refresh` | ✅ Used | `refreshApi()` with retry logic |
| POST `/auth/logout` | ✅ Used | `logoutApi()` - **FIXED: now uses router nav instead of reload** |
| POST `/auth/change-password` | ✅ Used | `changePasswordApi()` |
| POST `/auth/forgot-password` | ✅ Used | `forgotPasswordApi()` |
| POST `/auth/reset-password` | ✅ Used | `resetPasswordApi()` |
| GET `/auth/sessions` | ❌ **MISSING** | No frontend call; profile uses `/profile/sessions` instead |

**Missing UI Components:** None - auth flow is complete.

---

### 2. ORGANIZATION MODULE
**Backend Flow:** Departments → Working Weeks → Shifts → Holiday Calendars → Holidays → Locations → Settings (Singleton)

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| POST `/organization/departments` | ✅ Used | |
| GET `/organization/departments` | ✅ Used | |
| GET `/organization/departments/{id}` | ✅ Used | |
| PATCH `/organization/departments/{id}` | ✅ Used | |
| POST `/organization/departments/{id}/archive` | ❌ **MISSING** | **No Archive button in Department list/detail** |
| POST `/organization/working-weeks` | ✅ Used | |
| GET `/organization/working-weeks` | ✅ Used | |
| GET `/organization/working-weeks/current` | ✅ Used | |
| GET `/organization/working-weeks/{id}` | ✅ Used | |
| DELETE `/organization/working-weeks/{id}` | ❌ **MISSING** | **No Delete button for Working Weeks** |
| POST `/organization/shifts` | ✅ Used | |
| GET `/organization/shifts` | ✅ Used | |
| GET `/organization/shifts/{id}` | ✅ Used | |
| PATCH `/organization/shifts/{id}` | ✅ Used | |
| POST `/organization/shifts/{id}/archive` | ✅ Used | Archive implemented |
| POST `/organization/holiday-calendars` | ✅ Used | |
| GET `/organization/holiday-calendars` | ✅ Used | |
| GET `/organization/holiday-calendars/{id}` | ✅ Used | |
| PATCH `/organization/holiday-calendars/{id}` | ✅ Used | |
| POST `/organization/holiday-calendars/{id}/archive` | ❌ **MISSING** | **No Archive button for Holiday Calendars** |
| POST `/organization/holidays` | ✅ Used | |
| GET `/organization/holiday-calendars/{id}/holidays` | ✅ Used | |
| DELETE `/organization/holidays/{id}` | ❌ **MISSING** | **No Delete button for individual Holidays** |
| POST `/organization/locations` | ✅ Used | |
| GET `/organization/locations` | ✅ Used | |
| GET `/organization/locations/{id}` | ✅ Used | |
| PATCH `/organization/locations/{id}` | ✅ Used | |
| POST `/organization/locations/{id}/archive` | ❌ **MISSING** | **No Archive button for Locations** |
| GET `/organization/settings` | ✅ Used | |
| PUT `/organization/settings` | ✅ Used | Frontend uses PATCH (method mismatch) |

**Missing UI Components Summary:**
- ❌ Archive buttons for: Departments, Holiday Calendars, Locations
- ❌ Delete buttons for: Working Weeks, Holidays
- ⚠️ Settings uses PATCH vs backend PUT

---

### 3. EMPLOYMENT MODULE (Workforce)
**Backend Flow:** Positions → Employments (Create/List/Detail/Update) → State Transitions (History) → Assignments (Department/Position/Location/Shift)

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| POST `/employment/positions` | ✅ Used | |
| GET `/employment/positions` | ✅ Used | |
| GET `/employment/positions/{id}` | ✅ Used | |
| PATCH `/employment/positions/{id}` | ✅ Used | |
| POST `/employment/positions/{id}/archive` | ❌ **MISSING** | **No Archive button for Positions** |
| POST `/employment/employments` | ✅ Used | |
| GET `/employment/employments` | ✅ Used | |
| GET `/employment/employments/by-person/{person_id}` | ❌ **MISSING** | **No "View employments by person" UI** |
| GET `/employment/employments/{id}` | ✅ Used | |
| PATCH `/employment/employments/{id}` | ✅ Used | |
| POST `/employment/employments/{id}/state` | ❌ **MISSING** | **No State Change UI (transition workflow)** |
| GET `/employment/employments/{id}/state-history` | ❌ **MISSING** | **No State History display** |
| POST `/employment/employments/{id}/assignments` | ❌ **MISSING** | **No Assignment creation UI** |
| GET `/employment/employments/{id}/assignments/current` | ❌ **MISSING** | **No Current Assignment detail view** |
| GET `/employment/employments/{id}/assignments` | ❌ **MISSING** | **No Assignment History list** |

**Missing UI Components Summary:**
- ❌ Position Archive button
- ❌ Employment State Change workflow (modal/form with reason, effective date)
- ❌ Employment State History timeline
- ❌ Assignment management (create, view current, view history)
- ❌ "Employments by Person" lookup

---

### 4. RBAC MODULE
**Backend Flow:** Resources/Permissions/Scopes/Sensitive Fields (Seeded) → Roles (CRUD + Permissions + Sensitive Fields) → Employee Role Assignment → Effective Permissions

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| GET `/rbac/resources` | ✅ Used | |
| GET `/rbac/permissions` | ✅ Used | |
| GET `/rbac/scopes` | ❌ **MISSING** | **No Scope management UI** |
| GET `/rbac/sensitive-fields` | ❌ **MISSING** | **No Sensitive Fields catalog UI** |
| POST `/rbac/roles` | ✅ Used | |
| GET `/rbac/roles` | ✅ Used | |
| GET `/rbac/roles/{id}` | ✅ Used | |
| PATCH `/rbac/roles/{id}` | ✅ Used | |
| DELETE `/rbac/roles/{id}` | ✅ Used | |
| POST `/rbac/roles/{id}/permissions` | ❌ **MISSING** | **No "Grant Permission to Role" UI** |
| DELETE `/rbac/roles/{id}/permissions/{pid}/scopes/{sid}` | ❌ **MISSING** | **No "Revoke Permission from Role" UI** |
| POST `/rbac/employments/{id}/roles` | ❌ **MISSING** | **No "Assign Role to Employee" UI** |
| DELETE `/rbac/employments/{id}/roles/{role_id}` | ❌ **MISSING** | **No "Unassign Role from Employee" UI** |
| GET `/rbac/employments/{id}/roles` | ❌ **MISSING** | **No "View Employee's Roles" UI** |
| GET `/rbac/employments/{id}/effective-permissions` | ❌ **MISSING** | **No Effective Permissions viewer** |
| PUT `/rbac/roles/{id}/sensitive-fields` | ❌ **MISSING** | **No Field-Level Permission UI** |

**Missing UI Components Summary:**
- ❌ Scope management (list, create, edit)
- ❌ Sensitive Fields catalog
- ❌ Role-Permission matrix UI (grant/revoke with scope)
- ❌ Employee-Role assignment UI (assign/unassign)
- ❌ Effective Permissions viewer (for debugging/authorization checks)
- ❌ Field-level permission configuration

---

### 5. APPROVALS MODULE
**Backend Flow:** Create Request (by consumers) → List/Detail → Approve/Reject/Cancel/Comment → Domain Events → Consumers handle status projection

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| POST `/approvals/requests` | ✅ Used (indirect via Leave/Attendance) | |
| GET `/approvals/requests` | ✅ Used | |
| GET `/approvals/requests/{id}` | ✅ Used | |
| GET `/approvals/requests/by-reference/{type}/{ref}` | ❌ **MISSING** | **No "Find approval by reference" UI** |
| POST `/approvals/requests/{id}/approve` | ✅ Used | |
| POST `/approvals/requests/{id}/reject` | ✅ Used | |
| POST `/approvals/requests/{id}/cancel` | ❌ **MISSING** | **No Cancel button on approval detail** |
| POST `/approvals/requests/{id}/comment` | ❌ **MISSING** | **No Comment/Thread UI on approvals** |

**Missing UI Components Summary:**
- ❌ "Find by Reference" lookup
- ❌ Cancel action (requester should be able to cancel own pending requests)
- ❌ Comment/thread discussion on approval requests

---

### 6. LEAVE MODULE
**Backend Flow:** Policies (Versioned) → Requests (Submit → Approval → Ledger) → Balances → Apply Context (Holidays + Types + Balances) → Calculate (Working Days)

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| POST `/leave/policies` | ❌ **MISSING** | **No Create Policy UI** (Admin) |
| GET `/leave/policies` | ✅ Used | |
| GET `/leave/policies/current/{type}` | ❌ **MISSING** | **No "Current Policy by Type" viewer** |
| POST `/leave/requests` | ✅ Used | |
| GET `/leave/requests` | ✅ Used | |
| GET `/leave/requests/{id}` | ✅ Used | |
| POST `/leave/requests/{id}/cancel` | ❌ **MISSING** | **No Cancel button on Leave Request** |
| POST `/leave/ledger` | ❌ **MISSING** | **No Manual Ledger Entry UI** (Admin) |
| GET `/leave/ledger/{employment_id}` | ✅ Used (Admin) | |
| GET `/leave/balances/{employment_id}` | ✅ Used | |
| GET `/leave/apply-context/{employment_id}` | ✅ Used | |
| POST `/leave/calculate` | ✅ Used | |

**Missing UI Components Summary:**
- ❌ Leave Policy CRUD (Admin) - create, view current by type
- ❌ Cancel Leave Request action
- ❌ Manual Ledger Entry (Admin adjustment)

---

### 7. ATTENDANCE MODULE
**Backend Flow:** Punch (Check-in/out) → Days (List/Detail) → Corrections (via Approvals) → Policies (Versioned) → Monthly Summaries (Rebuild/Lock) → Breaks (Start/End)

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| POST `/attendance/punch` | ❌ **MISSING** | **No Punch In/Out UI** (Core feature!) |
| GET `/attendance/days/{day_id}` | ❌ **MISSING** | **No Attendance Day Detail view** |
| GET `/attendance/days/by-employment/{id}` | ✅ Used (partial) | |
| POST `/attendance/corrections` | ✅ Used | |
| GET `/attendance/corrections/{id}` | ❌ **MISSING** | **No Correction Detail view** |
| POST `/attendance/policies` | ❌ **MISSING** | **No Attendance Policy CRUD** (Admin) |
| GET `/attendance/policies` | ❌ **MISSING** | **No Policy List UI** |
| GET `/attendance/policies/current` | ❌ **MISSING** | **No Current Policy viewer** |
| GET `/attendance/summaries/{emp}/{year}/{month}` | ❌ **MISSING** | **No Monthly Summary view** |
| POST `/attendance/summaries/{emp}/{year}/{month}/rebuild` | ❌ **MISSING** | **No Rebuild Summary button** (Admin) |
| POST `/attendance/summaries/{emp}/{year}/{month}/lock` | ❌ **MISSING** | **No Lock Summary button** (Admin/Payroll) |
| POST `/attendance/breaks/start` | ❌ **MISSING** | **No Break Start UI** |
| POST `/attendance/breaks/{id}/end` | ❌ **MISSING** | **No Break End UI** |

**Missing UI Components Summary:**
- ❌ **Punch In/Out** - Core attendance feature completely missing!
- ❌ Break tracking (Start/End)
- ❌ Attendance Policy management (Admin)
- ❌ Monthly Summary view + Rebuild + Lock (Admin/Payroll integration)
- ❌ Attendance Day Detail view

---

### 8. NOTIFICATIONS MODULE
**Backend Flow:** Templates → Notify (Single/Bulk, Template or Direct) → Inbox (List/Unread Count) → Mark Read/Archive → Preferences

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| POST `/notifications/templates` | ❌ **MISSING** | **No Template Management UI** |
| GET `/notifications/templates` | ❌ **MISSING** | **No Template List UI** |
| GET `/notifications/templates/{id}` | ❌ **MISSING** | **No Template Detail/Editor** |
| PATCH `/notifications/templates/{id}` | ❌ **MISSING** | **No Template Update UI** |
| POST `/notifications/notify` | ✅ Used (as `/compose`) | |
| POST `/notifications/notify/bulk` | ❌ **MISSING** | **No Bulk Notify UI** |
| GET `/notifications/inbox` | ✅ Used | |
| GET `/notifications/inbox/unread-count` | ✅ Used | |
| POST `/notifications/inbox/{id}/read` | ✅ Used | |
| POST `/notifications/inbox/{id}/archive` | ✅ Used | |
| GET `/notifications/preferences` | ❌ **MISSING** | **No Notification Preferences UI** |
| PUT `/notifications/preferences` | ❌ **MISSING** | **No Preference Toggle UI** |

**Missing UI Components Summary:**
- ❌ Template Management (CRUD)
- ❌ Bulk Notification sending
- ❌ Notification Preferences (enable/disable channels)

---

### 9. SALES MODULE
**Backend Flow:** Clients (CRUD + Archive + Contacts) → Platforms (CRUD + Archive) → Leads (CRUD + Status Change → WON creates Client + optional Project)

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| POST `/sales/clients` | ✅ Used | |
| GET `/sales/clients` | ✅ Used | |
| GET `/sales/clients/{id}` | ✅ Used | |
| PATCH `/sales/clients/{id}` | ✅ Used | |
| POST `/sales/clients/{id}/archive` | ❌ **MISSING** | **No Archive Client button** |
| POST `/sales/contacts` | ❌ **MISSING** | **No Contact Management UI** |
| GET `/sales/clients/{id}/contacts` | ❌ **MISSING** | **No Client Contacts view** |
| POST `/sales/platforms` | ❌ **MISSING** | **No Platform CRUD UI** |
| GET `/sales/platforms` | ❌ **MISSING** | **No Platform List UI** |
| PATCH `/sales/platforms/{id}` | ❌ **MISSING** | **No Platform Edit UI** |
| POST `/sales/platforms/{id}/archive` | ❌ **MISSING** | **No Archive Platform button** |
| POST `/sales/leads` | ✅ Used | |
| GET `/sales/leads` | ✅ Used | |
| GET `/sales/leads/{id}` | ✅ Used | |
| PATCH `/sales/leads/{id}` | ✅ Used | |
| POST `/sales/leads/{id}/status` | ❌ **MISSING** | **No Lead Status Change UI** (separate from edit) |

**Missing UI Components Summary:**
- ❌ Client Archive button
- ❌ Client Contact management (add/list)
- ❌ Platform CRUD (create/list/edit/archive)
- ❌ Lead Status Change workflow (WON/LOST/CLOSED with client creation)

---

### 10. PAYROLL MODULE
**Backend Flow:** Salary Config (Versioned) → Calculate (with Attendance LOP) → Approve → Pay (Locks Attendance) → Bank Accounts

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| POST `/payroll/salaries` | ❌ **MISSING** | **No Create Salary Config UI** |
| GET `/payroll/salaries/current/{id}` | ✅ Used (partial - different path) | Path mismatch: frontend expects `/payroll/employees/{id}/salary` |
| GET `/payroll/salaries/{id}` | ❌ **MISSING** | **No Salary History view** |
| POST `/payroll/calculate` | ❌ **MISSING** | **No "Calculate Payroll" UI** (different from frontend's run/preview/checks) |
| POST `/payroll/{id}/approve` | ❌ **MISSING** | **No Approve Payroll button** (per employee vs per payroll run) |
| POST `/payroll/{id}/pay` | ✅ Used (partial - path mismatch) | Frontend uses `/payroll/employees/{id}/pay` |
| GET `/payroll/{id}` | ❌ **MISSING** | **No Payroll Detail view** |
| GET `/payroll` | ✅ Used | |
| POST `/payroll/bank-accounts` | ❌ **MISSING** | **No Bank Account Management UI** |
| GET `/payroll/bank-accounts/{id}` | ❌ **MISSING** | **No Bank Accounts List** |
| GET `/payroll/bank-accounts/{id}/primary` | ❌ **MISSING** | **No Primary Bank view** |

**Missing UI Components Summary:**
- ❌ Salary Configuration CRUD (versioned)
- ❌ Calculate Payroll (with adjustments)
- ❌ Payroll Approve/Pay workflow (per payroll record)
- ❌ Payroll Detail view
- ❌ Bank Account Management
- ⚠️ **Major Path Mismatch**: Backend uses `/payroll/salaries/{employment_id}`, Frontend expects `/payroll/employees/{id}/salary`

---

### 11. DEVELOPER MODULE (Projects/Tasks/Time)
**Backend Flow:** Teams (CRUD + Members) → Projects (CRUD) → Tasks (CRUD) → Time Entries

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| POST `/developer/teams` | ✅ Used (via `/projects/teams`) | |
| GET `/developer/teams` | ✅ Used (via `/projects/teams`) | |
| GET `/developer/teams/{id}` | ✅ Used (via `/projects/teams`) | |
| PATCH `/developer/teams/{id}` | ✅ Used (via `/projects/teams`) | |
| POST `/developer/teams/{id}/members` | ❌ **MISSING** | **No Add Team Member UI** |
| DELETE `/developer/teams/{id}/members/{emp_id}` | ❌ **MISSING** | **No Remove Team Member UI** |
| GET `/developer/teams/{id}/members` | ✅ Used | |
| POST `/developer/projects` | ✅ Used (via `/projects`) | |
| GET `/developer/projects` | ✅ Used (via `/projects`) | |
| GET `/developer/projects/{id}` | ✅ Used (via `/projects`) | |
| PATCH `/developer/projects/{id}` | ✅ Used (via `/projects`) | |
| POST `/developer/tasks` | ✅ Used (via `/projects/tasks`) | |
| GET `/developer/projects/{id}/tasks` | ✅ Used (via `/projects/tasks`) | |
| GET `/developer/tasks/{id}` | ✅ Used (via `/projects/tasks`) | |
| PATCH `/developer/tasks/{id}` | ✅ Used (via `/projects/tasks`) | |
| POST `/developer/time-entries` | ❌ **MISSING** | **No Time Entry UI** |
| GET `/developer/tasks/{id}/time-entries` | ❌ **MISSING** | **No Time Entries List** |

**Missing UI Components Summary:**
- ❌ Team Member Management (Add/Remove)
- ❌ Time Tracking (Create/List Time Entries)
- ⚠️ **Path Mismatch**: Frontend uses `/projects/*` prefix, Backend uses `/developer/*`

---

### 12. NOTES & DOCUMENTS MODULE
**Backend Flow:** Notes (Lead/Task/Client) → Document Types → Documents (Versions) → Links (Polymorphic)

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| **ALL 15 ENDPOINTS** | ❌ **COMPLETELY MISSING** | **Entire module has NO frontend integration** |

**Missing UI Components Summary:**
- ❌ Notes: Create/List/Update (on Leads, Tasks, Clients)
- ❌ Document Types: CRUD + Archive
- ❌ Documents: Create/Detail/Versions/Archive
- ❌ Document Links: Link to entities + List by entity/document

---

### 13. AUDIT MODULE
**Backend Flow:** Log (Best-effort, isolated TX) → Query (Filters) → Archive (Export to Storage → Delete)

| Backend Endpoint | Frontend Status | Missing UI Components |
|------------------|-----------------|----------------------|
| **ALL 4 ENDPOINTS** | ❌ **COMPLETELY MISSING** | **Entire module has NO frontend integration** |

**Missing UI Components Summary:**
- ❌ Audit Log Viewer (list with filters: type, reference, action, user, date range)
- ❌ Audit Log Detail
- ❌ Archive Job Trigger (Admin)

---

### 14. NOTIFICATIONS MODULE (Additional)
**Backend Flow:** (Already covered above)

---

## Cross-Module Integration Flows (Backend Only)

The backend has sophisticated cross-module wiring that the frontend doesn't expose:

| Integration | Backend Flow | Frontend Exposure |
|-------------|--------------|-------------------|
| **Lead WON → Client + Project** | Sales: `change_lead_status` → creates Client → calls Developer `create_from_lead` → notifies | Frontend only does basic lead status change; no project auto-create UI |
| **Leave/Attendance → Approvals** | Leave/Attendance submit → create Approval request → decision event → updates local status + ledger/day | Frontend shows approvals but doesn't show the cross-module linkage |
| **Payroll PAID → Attendance Lock** | Payroll `mark_paid` → calls Attendance `lock_monthly_summary` | Frontend has no "Lock Summary" button; no payroll-attendance linkage visible |
| **All Actions → Audit** | Every service calls `_audit()` post-commit | **No Audit Trail UI at all** |

---

## Specific Examples of Missing Features

### Example 1: Runtime Policy Creation (Attendance & Leave)
**Backend:** Full versioned policy system with `effective_from`/`effective_to`, auto-close previous, validation rules (correction window, max corrections/month, reasons mandatory, etc.)
**Frontend:** Only reads policies; no Create/Edit/Archive UI for Attendance or Leave policies
**Required UI:** Policy Management page with version timeline, form with all validation rules

### Example 2: Delete/Archive Buttons
**Backend:** Archive endpoints for: Departments, Shifts, Holiday Calendars, Locations, Positions, Clients, Platforms, Document Types, Documents
**Frontend:** Only Shifts and Departments (via PATCH isArchived) have archive; missing for Holiday Calendars, Locations, Positions, Clients, Platforms, Document Types, Documents
**Pattern Inconsistency:** Backend uses POST `/archive`, Frontend uses PATCH `isArchived`

### Example 3: Attendance Punch & Break Tracking
**Backend:** Complete punch in/out with geo/IP validation, policy enforcement (require checkout, max punches), break start/end with duration
**Frontend:** **Completely missing** - no punch clock, no break tracker

### Example 4: RBAC Permission Matrix
**Backend:** Full role-permission-scope grants, employee-role assignments, sensitive field permissions, effective permissions computation
**Frontend:** Only Role CRUD; no permission matrix, no employee-role assignment, no effective permissions viewer

### Example 5: Monthly Attendance Summary & Payroll Lock
**Backend:** Rebuild/Lock monthly summaries, payroll PAID triggers lock
**Frontend:** No summary view, no rebuild, no lock, no payroll-attendance integration visible

---

## Priority Implementation Matrix

### Phase 1: Critical Missing Features (Block Core Functionality)
| Priority | Feature | Module | Effort |
|----------|---------|--------|--------|
| P0 | Attendance Punch In/Out | Attendance | High |
| P0 | Attendance Break Tracking | Attendance | Medium |
| P0 | Monthly Attendance Summary + Rebuild/Lock | Attendance | High |
| P0 | Payroll Salary Config + Calculate + Approve/Pay | Payroll | High |
| P0 | Bank Account Management | Payroll | Medium |
| P0 | Leave Policy CRUD + Cancel Request | Leave | Medium |

### Phase 2: Admin/Management Features
| Priority | Feature | Module | Effort |
|----------|---------|--------|--------|
| P1 | Attendance Policy Management | Attendance | Medium |
| P1 | Position Archive | Employment | Low |
| P1 | Department/Holiday Calendar/Location Archive | Organization | Low |
| P1 | Working Week/Holiday Delete | Organization | Low |
| P1 | Client/Platform Archive + Contacts | Sales | Medium |
| P1 | Lead Status Change (WON flow) | Sales | Medium |

### Phase 3: RBAC & Authorization
| Priority | Feature | Module | Effort |
|----------|---------|--------|--------|
| P2 | Role-Permission Matrix (Grant/Revoke) | RBAC | High |
| P2 | Employee-Role Assignment | RBAC | High |
| P2 | Effective Permissions Viewer | RBAC | Medium |
| P2 | Sensitive Field Permissions | RBAC | Medium |
| P2 | Scope Management | RBAC | Medium |

### Phase 4: Complete Missing Modules
| Priority | Feature | Module | Effort |
|----------|---------|--------|--------|
| P3 | Notes & Documents (Full CRUD) | Notes & Documents | High |
| P3 | Audit Log Viewer + Archive | Audit | Medium |

### Phase 5: Cross-Module Integration UI
| Priority | Feature | Module | Effort |
|----------|---------|--------|--------|
| P4 | Lead WON → Project Auto-create | Sales + Developer | Medium |
| P4 | Payroll-Attendance Lock Integration | Payroll + Attendance | Medium |
| P4 | Approval Comments/Threads | Approvals | Low |
| P4 | Approval Cancel by Requester | Approvals | Low |

---

## URL Path Mismatches Requiring Alignment

| Frontend Path | Backend Path | Module | Resolution |
|---------------|--------------|--------|------------|
| `/workforce/employments/*` | `/employment/employments/*` | Employment | Standardize |
| `/workforce/departments/*` | `/organization/departments/*` | Organization | Standardize |
| `/projects/*` | `/developer/projects/*` | Developer | Standardize |
| `/projects/teams/*` | `/developer/teams/*` | Developer | Standardize |
| `/projects/tasks/*` | `/developer/tasks/*` | Developer | Standardize |
| `/payroll/employees/*` | `/payroll/salaries/*` | Payroll | Standardize |
| `/my-work/*` | Various | My Work | Map properly |

---

## Conclusion

The backend implements a **complete, production-ready system** with 14 modules, 189 endpoints, and sophisticated cross-module workflows. However, the **frontend only exposes ~45% of backend capabilities**.

**Top 3 Areas Needing Immediate Attention:**
1. **Attendance Core Features** - Punch, Breaks, Policies, Monthly Summaries (completely missing)
2. **Payroll Complete Flow** - Salary config, Calculate, Approve, Pay, Bank Accounts (path mismatches + missing UI)
3. **RBAC Full Implementation** - Permission matrix, Employee-role assignment, Effective permissions (only Role CRUD exists)

**Architectural Note:** The backend uses versioned entities (policies, salaries, working weeks, assignments) with `effective_from`/`effective_to` patterns. The frontend must support version timeline UIs, not just simple CRUD.

---
*This report is based on analysis of `02_backend_code/app/modules/*/services/public_service.py`, `*routes.py`, `*schemas/schemas.py` vs `01_frontend_code/src/modules/*/api/*.ts` and UI components.*