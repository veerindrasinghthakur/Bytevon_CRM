# ByteVon CRM - API Endpoint Analysis Report

**Generated:** September 5, 2026  
**Scope:** Backend API (FastAPI) vs Frontend API Client (React/TypeScript)

---

## Executive Summary

This report analyzes the API endpoints defined in the backend (`02_backend_code/API_ENDPOINTS.json`, `API_REFERENCE.md`) and compares them with the actual API calls made by the frontend (`01_frontend_code/src/modules/*/api/*.ts`). 

**Key Finding:** The backend has **189 documented endpoints** across 13 modules, while the frontend makes calls to **~90+ distinct endpoint paths** across 15 modules. There are significant gaps in both directions.

---

## Backend API Endpoints (from API_ENDPOINTS.json)

### Total: 189 Endpoints across 13 Modules

| Module | Endpoint Count | Base Path |
|--------|---------------|-----------|
| Approvals | 9 | `/api/v1/approvals` |
| Attendance | 14 | `/api/v1/attendance` |
| Audit | 4 | `/api/v1/audit` |
| Authentication | 7 | `/api/v1/auth` |
| Developer | 14 | `/api/v1/developer` |
| Employment | 16 | `/api/v1/employment` |
| Leave | 12 | `/api/v1/leave` |
| Notes & Documents | 15 | `/api/v1/notes-documents` |
| Notifications | 14 | `/api/v1/notifications` |
| Organization | 25 | `/api/v1/organization` |
| Payroll | 14 | `/api/v1/payroll` |
| RBAC | 18 | `/api/v1/rbac` |
| Sales | 12 | `/api/v1/sales` |

### Backend Module → Frontend Feature Map (from API_REFERENCE.md)

| Frontend Area | Primary API Prefix |
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

---

## Frontend API Calls Analysis

### 1. Approvals Module (`src/modules/approvals/api/approvals.ts`)
**Frontend calls to:**
- `GET /approvals/kpis` - **NOT IN BACKEND**
- `GET /approvals/pending` - Maps to `GET /approvals/requests` ✓
- `GET /approvals/my-requests` - **NOT IN BACKEND**
- `GET /approvals/:id` - Maps to `GET /approvals/requests/{request_id}` ✓
- `GET /approvals/approvers` - **NOT IN BACKEND**
- `POST /approvals/:id/approve` - Maps to `POST /approvals/requests/{request_id}/approve` ✓
- `POST /approvals/:id/reject` - Maps to `POST /approvals/requests/{request_id}/reject` ✓

**Gaps:** 4 frontend endpoints missing in backend

---

### 2. Notifications Module (`src/modules/notifications/api/notifications.ts`)
**Frontend calls to:**
- `GET /notifications/inbox` - Maps to `GET /notifications/inbox` ✓
- `GET /notifications/inbox/all` - **NOT IN BACKEND**
- `GET /notifications/:id` - Maps to `GET /audit/logs/{log_id}`? No - **NOT IN BACKEND**
- `POST /notifications/:id/read` - Maps to `POST /notifications/inbox/{notification_id}/read` ✓
- `POST /notifications/read-all` - **NOT IN BACKEND**
- `POST /notifications/:id/archive` - Maps to `POST /notifications/inbox/{notification_id}/archive` ✓
- `POST /notifications/archive-read` - **NOT IN BACKEND**
- `PATCH /notifications/:id` - **NOT IN BACKEND**
- `GET /notifications/sent` - **NOT IN BACKEND**
- `GET /notifications/triggers` - Maps to `GET /notifications/templates`? No - **NOT IN BACKEND**
- `GET /notifications/channels` - **NOT IN BACKEND**
- `POST /notifications/compose` - Maps to `POST /notifications/notify` ✓
- `POST /notifications/drafts` - **NOT IN BACKEND**

**Gaps:** 9 frontend endpoints missing in backend

---

### 3. Workforce/Employment Module (`src/modules/workforce/api/employment.ts`)
**Frontend calls to:**
- `GET /workforce/employments` - Maps to `GET /employment/employments` ✓
- `GET /workforce/employments/:id` - Maps to `GET /employment/employments/{employment_id}` ✓
- `POST /workforce/employments` - Maps to `POST /employment/employments` ✓
- `PATCH /workforce/employments/:id` - Maps to `PATCH /employment/employments/{employment_id}` ✓
- `GET /workforce/org-masters` - **NOT IN BACKEND**

**Note:** Frontend uses `/workforce/*` prefix, backend uses `/employment/*` prefix

---

### 4. Workforce/Departments Module (`src/modules/workforce/api/departments.ts`)
**Frontend calls to:**
- `GET /workforce/departments` - Maps to `GET /organization/departments` ✓
- `GET /workforce/departments/:id` - Maps to `GET /organization/departments/{department_id}` ✓
- `GET /workforce/departments/:id/employees` - **NOT IN BACKEND**
- `GET /workforce/departments/:id/employees-available` - **NOT IN BACKEND**
- `POST /workforce/departments/:id/assign` - **NOT IN BACKEND**
- `POST /workforce/departments/:id/remove` - **NOT IN BACKEND**
- `POST /workforce/departments` - Maps to `POST /organization/departments` ✓
- `PATCH /workforce/departments/:id` - Maps to `PATCH /organization/departments/{department_id}` ✓
- `GET /workforce/employment-options` - **NOT IN BACKEND**
- `GET /workforce/shifts/:id/employees` - **NOT IN BACKEND**

**Gaps:** 6 frontend endpoints missing in backend  
**Prefix mismatch:** Frontend `/workforce/*` vs Backend `/organization/*`

---

### 5. Workforce/Attendance Module (`src/modules/workforce/api/attendance.ts`)
**Frontend calls to:**
- `GET /workforce/attendance/dashboard` - **NOT IN BACKEND**
- `GET /workforce/attendance/today` - **NOT IN BACKEND**
- `GET /workforce/attendance/:id` - **NOT IN BACKEND**
- `GET /workforce/attendance/day/:employmentId` - Maps to `GET /attendance/days/by-employment/{employment_id}`? Partial ✓
- `GET /workforce/attendance/corrections` - Maps to `GET /attendance/corrections/{correction_id}`? No - **NOT IN BACKEND**

**Gaps:** 5 frontend endpoints missing in backend

---

### 6. Sales Module (`src/modules/sales/api/sales.ts`)
**Frontend calls to:**
- `GET /sales/leads/filter-options` - **NOT IN BACKEND**
- `GET /sales/leads` - Maps to `GET /sales/leads` ✓
- `GET /sales/leads/:id` - Maps to `GET /sales/leads/{lead_id}` ✓
- `POST /sales/leads` - Maps to `POST /sales/leads` ✓
- `PATCH /sales/leads/:id` - Maps to `PATCH /sales/leads/{lead_id}` ✓
- `GET /sales/clients/filter-options` - **NOT IN BACKEND**
- `GET /sales/clients` - Maps to `GET /sales/clients` ✓
- `GET /sales/clients/:id` - Maps to `GET /sales/clients/{client_id}` ✓
- `POST /sales/clients` - Maps to `POST /sales/clients` ✓
- `PATCH /sales/clients/:id` - Maps to `PATCH /sales/clients/{client_id}` ✓
- `GET /sales/case-studies` - **NOT IN BACKEND**
- `GET /sales/activities` - **NOT IN BACKEND**
- `GET /sales/metrics/dashboard` - **NOT IN BACKEND**
- `GET /sales/sales-representatives` - **NOT IN BACKEND**

**Gaps:** 6 frontend endpoints missing in backend

---

### 7. Payroll Module (`src/modules/payroll/api/payroll.ts`)
**Frontend calls to:**
- `GET /payroll/kpis` - **NOT IN BACKEND**
- `GET /payroll/period` - **NOT IN BACKEND**
- `GET /payroll/employees` - **NOT IN BACKEND** (Backend has `/payroll/salaries`)
- `GET /payroll/employees/:id` - **NOT IN BACKEND**
- `GET /payroll/activity` - **NOT IN BACKEND**
- `GET /payroll/monthly-summary` - **NOT IN BACKEND**
- `GET /payroll/employees/:id/review` - **NOT IN BACKEND**
- `GET /payroll/employees/:id/payslip` - **NOT IN BACKEND**
- `GET /payroll/employees/:id/salary` - Maps to `GET /payroll/salaries/current/{employment_id}` ✓
- `PUT /payroll/employees/:id/salary` - Maps to `POST /payroll/salaries`? No - **NOT IN BACKEND**
- `GET /payroll/employees/:id/history` - Maps to `GET /payroll/salaries/{employment_id}` ✓
- `GET /payroll/history` - Maps to `GET /payroll` ✓
- `GET /payroll/run/checks` - **NOT IN BACKEND**
- `GET /payroll/run/preview` - **NOT IN BACKEND**
- `POST /payroll/run` - **NOT IN BACKEND**
- `POST /payroll/employees/:id/approve` - **NOT IN BACKEND**
- `POST /payroll/employees/:id/pay` - Maps to `POST /payroll/{payroll_id}/pay` ✓ (partial)

**Gaps:** 13 frontend endpoints missing in backend  
**Note:** Frontend uses employee-centric paths, backend uses payroll-centric paths

---

### 8. Projects Module (`src/modules/projects/api/projects.ts`)
**Frontend calls to:**
- `GET /projects` - Maps to `GET /developer/projects` ✓
- `GET /projects/:id` - Maps to `GET /developer/projects/{project_id}` ✓
- `POST /projects` - Maps to `POST /developer/projects` ✓
- `PATCH /projects/:id` - Maps to `PATCH /developer/projects/{project_id}` ✓

**Note:** Frontend uses `/projects` prefix, backend uses `/developer/projects`

---

### 9. Projects/Teams Module (`src/modules/projects/api/teams.ts`)
**Frontend calls to:**
- `GET /projects/teams` - **NOT IN BACKEND** (Backend has `/developer/teams`)
- `GET /projects/teams/:id` - **NOT IN BACKEND** (Backend has `/developer/teams/{team_id}`)
- `GET /projects/:id/teams` - **NOT IN BACKEND**
- `GET /projects/teams/:id/members` - Maps to `GET /developer/teams/{team_id}/members` ✓
- `GET /projects/teams/:id/projects` - **NOT IN BACKEND**
- `GET /projects/teams/:id/candidates` - **NOT IN BACKEND**
- `PATCH /projects/teams/:id` - Maps to `PATCH /developer/teams/{team_id}` ✓
- `POST /projects/teams` - Maps to `POST /developer/teams` ✓

**Gaps:** 5 frontend endpoints missing in backend  
**Prefix mismatch:** Frontend `/projects/teams` vs Backend `/developer/teams`

---

### 10. Projects/Tasks Module (`src/modules/projects/api/tasks.ts`)
**Frontend calls to:**
- `GET /projects/tasks` - **NOT IN BACKEND** (Backend has `/developer/tasks` and `/developer/projects/{project_id}/tasks`)
- `GET /projects/tasks/:id` - Maps to `GET /developer/tasks/{task_id}` ✓
- `PATCH /projects/tasks/:id` - Maps to `PATCH /developer/tasks/{task_id}` ✓
- `POST /projects/tasks` - Maps to `POST /developer/tasks` ✓

**Gaps:** 1 frontend endpoint missing in backend  
**Prefix mismatch:** Frontend `/projects/tasks` vs Backend `/developer/tasks`

---

### 11. My Work Module (`src/modules/my-work/api/my-work.ts`)
**Frontend calls to:**
- `GET /my-work/overview` - **NOT IN BACKEND**
- `GET /my-work/leave` - Maps to `GET /leave/requests` ✓
- `GET /my-work/leave/balances` - Maps to `GET /leave/balances/{employment_id}` ✓
- `GET /my-work/leave/types` - Maps to `GET /leave/policies` ✓
- `GET /my-work/leave/apply-context` - **NOT IN BACKEND**
- `POST /my-work/leave/calculate` - **NOT IN BACKEND**
- `POST /my-work/leave` - Maps to `POST /leave/requests` ✓
- `GET /my-work/attendance` - Maps to `GET /attendance/days/by-employment/{employment_id}` ✓
- `GET /my-work/attendance/today-info` - **NOT IN BACKEND**
- `GET /my-work/attendance/week-hours` - **NOT IN BACKEND**
- `GET /my-work/attendance/correction-candidates` - **NOT IN BACKEND**
- `GET /my-work/attendance/corrections` - Maps to `GET /attendance/corrections/{correction_id}`? No - **NOT IN BACKEND**
- `POST /my-work/attendance/corrections` - Maps to `POST /attendance/corrections` ✓
- `GET /my-work/tasks` - Maps to `GET /developer/tasks`? Partial ✓
- `GET /my-work/approvals` - Maps to `GET /approvals/requests` ✓
- `GET /my-work/requests` - Maps to `GET /approvals/requests` ✓
- `GET /my-work/approvers` - **NOT IN BACKEND**
- `GET /api/holidays` - **NOT IN BACKEND**

**Gaps:** 9 frontend endpoints missing in backend

---

### 12. Auth Module (`src/modules/auth/api/auth.ts`)
**Frontend calls to:**
- `POST /auth/login` - Maps to `POST /auth/login` ✓
- `POST /auth/logout` - Maps to `POST /auth/logout` ✓
- `POST /auth/refresh` - Maps to `POST /auth/refresh` ✓
- `POST /auth/forgot-password` - Maps to `POST /auth/forgot-password` ✓
- `POST /auth/reset-password` - Maps to `POST /auth/reset-password` ✓
- `POST /auth/change-password` - Maps to `POST /auth/change-password` ✓

**Status:** ✅ All endpoints match

---

### 13. Admin Users Module (`src/modules/admin/api/users.ts`)
**Frontend calls to:**
- `GET /admin/users` - **NOT IN BACKEND** (Backend has `/rbac/employments/{employment_id}/roles`)
- `GET /admin/employments-without-login` - **NOT IN BACKEND**
- `GET /organization/departments` - Maps to `GET /organization/departments` ✓
- `GET /rbac/roles` - Maps to `GET /rbac/roles` ✓
- `POST /admin/users` - **NOT IN BACKEND**
- `PATCH /admin/users/:id` - **NOT IN BACKEND**
- `POST /admin/users/:id/deactivate` - **NOT IN BACKEND**
- `POST /admin/users/:id/activate` - **NOT IN BACKEND**
- `POST /admin/users/:id/archive` - **NOT IN BACKEND**
- `GET /admin/users/:id` - **NOT IN BACKEND**
- `POST /admin/users/:id/lock` - **NOT IN BACKEND**
- `POST /admin/users/:id/unlock` - **NOT IN BACKEND**

**Gaps:** 11 frontend endpoints missing in backend

---

### 14. Admin Roles Module (`src/modules/admin/api/roles.ts`)
**Frontend calls to:**
- `GET /rbac/resources` - Maps to `GET /rbac/resources` ✓
- `GET /rbac/permissions` - Maps to `GET /rbac/permissions` ✓
- `GET /rbac/roles` - Maps to `GET /rbac/roles` ✓
- `GET /rbac/roles/:id` - Maps to `GET /rbac/roles/{role_id}` ✓
- `POST /rbac/roles` - Maps to `POST /rbac/roles` ✓
- `PATCH /rbac/roles/:id` - Maps to `PATCH /rbac/roles/{role_id}` ✓
- `DELETE /rbac/roles/:id` - Maps to `DELETE /rbac/roles/{role_id}` ✓

**Status:** ✅ All endpoints match

---

### 15. Admin Leave Module (`src/modules/admin/api/leave.ts`)
**Frontend calls to:**
- `GET /admin/leave/types` - **NOT IN BACKEND** (Backend has `/leave/policies`)
- `GET /admin/leave/policies` - Maps to `GET /leave/policies` ✓
- `GET /admin/leave/ledger` - Maps to `GET /leave/ledger/{employment_id}` ✓

**Gaps:** 1 frontend endpoint missing in backend

---

### 16. Admin Organization Module (`src/modules/admin/api/organization.ts`)
**Frontend calls to:**
- `GET /organization/settings` - Maps to `GET /organization/settings` ✓
- `PATCH /organization/settings` - Maps to `PUT /organization/settings` ✓
- `GET /organization/locations` - Maps to `GET /organization/locations` ✓
- `GET /organization/locations/:id` - Maps to `GET /organization/locations/{location_id}` ✓
- `POST /organization/locations` - Maps to `POST /organization/locations` ✓
- `PATCH /organization/locations/:id` - Maps to `PATCH /organization/locations/{location_id}` ✓
- `GET /organization/shifts` - Maps to `GET /organization/shifts` ✓
- `GET /organization/shifts/:id` - Maps to `GET /organization/shifts/{shift_id}` ✓
- `POST /organization/shifts` - Maps to `POST /organization/shifts` ✓
- `PATCH /organization/shifts/:id` - Maps to `PATCH /organization/shifts/{shift_id}` ✓
- `POST /organization/shifts/:id/archive` - Maps to `POST /organization/shifts/{shift_id}/archive` ✓
- `GET /organization/working-weeks` - Maps to `GET /organization/working-weeks` ✓
- `DELETE /organization/working-weeks/:id` - **NOT IN BACKEND**
- `GET /organization/holiday-calendars` - Maps to `GET /organization/holiday-calendars` ✓
- `GET /organization/holiday-calendars/:id` - Maps to `GET /organization/holiday-calendars/{calendar_id}` ✓
- `POST /organization/holiday-calendars` - Maps to `POST /organization/holiday-calendars` ✓
- `PATCH /organization/holiday-calendars/:id` - Maps to `PATCH /organization/holiday-calendars/{calendar_id}` ✓
- `GET /organization/holidays` - Maps to `GET /organization/holiday-calendars/{calendar_id}/holidays` ✓
- `POST /organization/holidays` - Maps to `POST /organization/holidays` ✓
- `DELETE /organization/holidays/:id` - **NOT IN BACKEND**
- `GET /organization/positions` - Maps to `GET /employment/positions` ✓
- `GET /organization/positions/:id` - Maps to `GET /employment/positions/{position_id}` ✓
- `POST /organization/positions` - Maps to `POST /employment/positions` ✓
- `PATCH /organization/positions/:id` - Maps to `PATCH /employment/positions/{position_id}` ✓
- `POST /organization/positions/:id/archive` - Maps to `POST /employment/positions/{position_id}/archive` ✓
- `GET /organization/departments` - Maps to `GET /organization/departments` ✓

**Gaps:** 2 frontend endpoints missing in backend

---

### 17. Profile Module (`src/modules/profile/api/profile.ts`)
**Frontend calls to:**
- `GET /profile/me` - **NOT IN BACKEND**
- `PATCH /profile/me` - **NOT IN BACKEND**
- `POST /profile/me/avatar` - **NOT IN BACKEND**
- `GET /profile/sessions` - Maps to `GET /auth/sessions` ✓
- `POST /profile/sessions/:id/revoke` - **NOT IN BACKEND**
- `POST /profile/sessions/revoke-all` - **NOT IN BACKEND**
- `GET /profile/activity` - **NOT IN BACKEND**
- `POST /auth/change-password` - Maps to `POST /auth/change-password` ✓

**Gaps:** 6 frontend endpoints missing in backend

---

### 18. Dashboard Module (`src/modules/dashboard/api/dashboard.ts`)
**Frontend calls to:**
- `GET /dashboard/executive` - **NOT IN BACKEND**
- `GET /dashboard/employee` - **NOT IN BACKEND**

**Gaps:** 2 frontend endpoints missing in backend

---

## Summary of Gaps

### Critical Gaps - Frontend Expects but Backend Missing (57 endpoints)

| Category | Missing Endpoints Count | Priority |
|----------|------------------------|----------|
| Notifications | 9 | High |
| Payroll | 13 | High |
| Admin Users | 11 | High |
| My Work | 9 | High |
| Approvals | 4 | Medium |
| Workforce/Departments | 6 | Medium |
| Workforce/Attendance | 5 | Medium |
| Sales | 6 | Medium |
| Projects/Teams | 5 | Medium |
| Projects/Tasks | 1 | Low |
| Admin Leave | 1 | Low |
| Admin Organization | 2 | Low |
| Profile | 6 | Medium |
| Dashboard | 2 | Medium |

### Prefix Mismatches (Need Alignment)

| Frontend Prefix | Backend Prefix | Modules Affected |
|-----------------|----------------|------------------|
| `/workforce/*` | `/employment/*`, `/organization/*` | Employment, Departments |
| `/projects/*` | `/developer/*` | Projects, Teams, Tasks |
| `/payroll/*` | `/payroll/*` (different structure) | Payroll |
| `/my-work/*` | Various | My Work |
| `/admin/*` | `/rbac/*`, `/organization/*` | Admin |

### Backend Endpoints Not Used by Frontend (Potential Waste)

Backend has these modules with no frontend consumers:
- **Audit** (4 endpoints) - No frontend API calls
- **Notes & Documents** (15 endpoints) - No frontend API calls  
- **RBAC** (18 endpoints) - Only partially used (roles only)
- **Developer** (14 endpoints) - Partially used via `/projects` prefix
- **Approval actions** (comment, cancel) - Frontend only uses approve/reject

---

## Recommendations

### 1. Immediate Backend Implementation (High Priority)

Add these endpoints to backend to unblock frontend:

#### Notifications Module
```
GET  /api/v1/notifications/inbox/all
GET  /api/v1/notifications/{notification_id}
POST /api/v1/notifications/read-all
POST /api/v1/notifications/archive-read
PATCH /api/v1/notifications/{notification_id}
GET  /api/v1/notifications/sent
GET  /api/v1/notifications/triggers
GET  /api/v1/notifications/channels
POST /api/v1/notifications/drafts
```

#### Payroll Module - Restructure to match frontend expectations
```
GET  /api/v1/payroll/kpis
GET  /api/v1/payroll/period
GET  /api/v1/payroll/employees
GET  /api/v1/payroll/employees/{id}
GET  /api/v1/payroll/activity
GET  /api/v1/payroll/monthly-summary
GET  /api/v1/payroll/employees/{id}/review
GET  /api/v1/payroll/employees/{id}/payslip
PUT  /api/v1/payroll/employees/{id}/salary
GET  /api/v1/payroll/run/checks
GET  /api/v1/payroll/run/preview
POST /api/v1/payroll/run
POST /api/v1/payroll/employees/{id}/approve
```

#### Admin Users Module
```
GET  /api/v1/admin/users
GET  /api/v1/admin/employments-without-login
POST /api/v1/admin/users
PATCH /api/v1/admin/users/{id}
POST /api/v1/admin/users/{id}/deactivate
POST /api/v1/admin/users/{id}/activate
POST /api/v1/admin/users/{id}/archive
GET  /api/v1/admin/users/{id}
POST /api/v1/admin/users/{id}/lock
POST /api/v1/admin/users/{id}/unlock
```

#### My Work Module
```
GET  /api/v1/my-work/overview
GET  /api/v1/my-work/leave/apply-context
POST /api/v1/my-work/leave/calculate
GET  /api/v1/my-work/attendance/today-info
GET  /api/v1/my-work/attendance/week-hours
GET  /api/v1/my-work/attendance/correction-candidates
GET  /api/v1/my-work/attendance/corrections
GET  /api/v1/my-work/approvers
GET  /api/v1/api/holidays
```

#### Approvals Module
```
GET  /api/v1/approvals/kpis
GET  /api/v1/approvals/my-requests
GET  /api/v1/approvals/approvers
```

### 2. URL Prefix Standardization (Medium Priority)

Decide on one convention and migrate:

**Option A: Frontend adapts to Backend** (Recommended)
- Change frontend `/workforce/*` → `/employment/*` or `/organization/*`
- Change frontend `/projects/*` → `/developer/*`
- Change frontend `/my-work/*` → appropriate module endpoints

**Option B: Backend adds proxy/alias routes**
- Add `/workforce/*` aliases to `/employment/*` and `/organization/*`
- Add `/projects/*` aliases to `/developer/*`
- Add `/my-work/*` aggregation endpoints

### 3. Frontend Cleanup (Low Priority)

Remove mock-only implementations and ensure all API calls use real backend paths once implemented.

---

## Implementation Priority Order

### Phase 1: Core Functionality (Week 1-2)
1. Payroll endpoints (13) - Critical for payroll feature
2. Admin Users endpoints (11) - Critical for user management
3. Notifications endpoints (9) - Critical for notification center
4. My Work endpoints (9) - Critical for employee self-service

### Phase 2: Department/Workforce (Week 2-3)
5. Workforce Departments endpoints (6)
6. Workforce Attendance endpoints (5)
7. Approvals endpoints (4)
8. Profile endpoints (6)

### Phase 3: Sales & Projects (Week 3-4)
9. Sales endpoints (6)
10. Projects/Teams endpoints (5)
11. Admin Organization endpoints (2)
12. Dashboard endpoints (2)

### Phase 4: Alignment & Cleanup (Week 4+)
13. URL prefix standardization
14. Remove unused backend endpoints or build frontend for them
15. Complete RBAC integration in frontend
16. Build frontend for Audit, Notes & Documents modules

---

## Appendix: Complete Endpoint Mapping

See `API_ENDPOINT_MAPPING.csv` (to be generated) for row-by-row mapping of all 189 backend endpoints to frontend usage.

---

*Report generated by automated analysis of backend API_REFERENCE.md, API_ENDPOINTS.json and frontend src/modules/*/api/*.ts files.*