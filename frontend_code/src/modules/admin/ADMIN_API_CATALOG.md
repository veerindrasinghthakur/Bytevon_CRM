# Admin API Catalog

Living document of admin-module APIs wired through `frontend_code/src/modules/admin/api/*`.

**Convention**

- Frontend: `env.useMockApi` → collected mock (`data/mock.ts` or `shared/mock/db`) · `false` → `apiClient` → mock backend.
- Backend base: `http://localhost:8001/api/v1`
- Store: `mock_backend/data/store.json` (regenerate with `python seed.py`)
- Routers: `routes/admin.py`, `routes/extras.py` (mounted under `/api/v1`)

When a new API is added: append a row here **and** ensure seed/store has related keys.

---

## Leave

| Method | Path | FE module | Store key | Notes |
|--------|------|-----------|-----------|-------|
| GET | `/admin/leave/types` | `api/leave.ts` → `listLeaveTypeSettings` | `leave_types` | Type cards for leave settings |
| GET | `/admin/leave/policies` | `api/leave.ts` → `listLeavePolicies` | `leave_policies` | Versioned policies |
| GET | `/admin/leave/ledger?employeeId=` | `api/leave.ts` → `listLeaveLedger` | `leave_ledger` | Optional filter by employeeId |

## Audit

| Method | Path | FE module | Store key | Notes |
|--------|------|-----------|-----------|-------|
| POST | `/admin/audit/events` | `api/audit.ts` → `recordAuditEvent` | `audit_logs` | Best-effort append |
| GET | `/admin/audit/logs` | `api/audit.ts` → `listAuditLogs` | `audit_logs` | List (also `/audit/logs`) |

## Metrics

| Method | Path | FE module | Store key | Notes |
|--------|------|-----------|-----------|-------|
| GET | `/admin/metrics/hub` | `api/metrics.ts` → `getAdminHubMetrics` | `metrics` + counts | Hub KPIs |
| GET | `/admin/metrics/roles` | `api/metrics.ts` → `getRoleListMetrics` | `roles`, `admin_users` | Role list cards |
| GET | `/admin/metrics/leave` | `api/metrics.ts` → `getLeaveAdminMetrics` | `leave_types` | Leave admin cards |
| GET | `/admin/metrics/attendance` | `api/metrics.ts` → `getAttendanceAdminMetrics` | (computed) | Attendance admin cards |

## Offices

| Method | Path | FE module | Store key | Notes |
|--------|------|-----------|-----------|-------|
| GET | `/admin/offices` | `api/offices.ts` → `listOffices` | `offices` | Full office list |
| GET | `/admin/offices/{officeId}` | `api/offices.ts` → `getOffice` | `offices` | Single office |
| GET | `/admin/offices/head-options` | `api/offices.ts` → `listHeadOfficeOptions` | `offices` | Compact picker rows |

## Organization settings & masters

| Method | Path | FE module | Store key | Notes |
|--------|------|-----------|-----------|-------|
| GET | `/organization/settings` | `api/organization.ts` → `getOrganizationSettings` | `organization_settings` | Singleton |
| PATCH | `/organization/settings` | `api/organization.ts` → `updateOrganizationSettings` | `organization_settings` | Partial update |
| GET | `/organization/locations` | `api/organization.ts` → `getLocations` | `locations` | `{ items, total }` |
| GET | `/organization/locations/{id}` | `api/organization.ts` → `getLocation` | `locations` | Detail |
| POST | `/organization/locations` | `api/organization.ts` → `createLocation` | `locations` | Create |
| PATCH | `/organization/locations/{id}` | `api/organization.ts` → `updateLocation` | `locations` | Update |
| GET | `/organization/shifts` | `api/organization.ts` → `getShifts` | `shifts` | `{ items, total }` |
| GET | `/organization/shifts/{id}` | `api/organization.ts` → `getShift` | `shifts` | Detail |
| POST | `/organization/shifts` | `api/organization.ts` → `createShift` | `shifts` | Create |
| PATCH | `/organization/shifts/{id}` | `api/organization.ts` → `updateShift` | `shifts` | Update |
| GET | `/organization/working-weeks` | `api/organization.ts` → `getWorkingWeeks` | `working_weeks` | `{ items, total }` |
| GET | `/organization/holiday-calendars` | `api/organization.ts` → `getHolidayCalendars` | `holiday_calendars` | `{ items, total }` |
| GET | `/organization/holidays?calendarId=` | `api/organization.ts` → `getHolidays` | `holidays` | Optional calendar filter |
| GET | `/organization/positions` | `api/organization.ts` → `getPositions` | `positions` | `{ items, total }` |
| GET | `/organization/departments` | `api/organization.ts` → `getSchemaDepartments` | `departments` | `{ items, total }` |

## RBAC

| Method | Path | FE module | Store key | Notes |
|--------|------|-----------|-----------|-------|
| GET | `/rbac/resources` | `api/roles.ts` → `listPermissionCatalog` | `resources` | With permissions |
| GET | `/rbac/permissions` | `api/roles.ts` → `listPermissionCatalog` | `permissions` | With resources |
| GET | `/rbac/roles` | `api/roles.ts` → `listAdminRoles` | `roles` | All roles |
| GET | `/rbac/roles/{roleId}` | `api/roles.ts` → `getAdminRole` | `roles` | Detail |
| POST | `/rbac/roles` | `api/roles.ts` → `createAdminRole` | `roles` | Create |
| PATCH | `/rbac/roles/{roleId}` | `api/roles.ts` → `updateAdminRole` | `roles` | Update |

## Admin settings (profile / attendance / leave accrual)

| Method | Path | FE module | Store key | Notes |
|--------|------|-----------|-----------|-------|
| GET | `/admin/settings/organization-profile` | `api/settings.ts` → `getOrganizationProfile` | `organization_profile` | Profile form |
| PATCH | `/admin/settings/organization-profile` | `api/settings.ts` → `updateOrganizationProfile` | `organization_profile` | Save profile |
| GET | `/admin/settings/attendance` | `api/settings.ts` → `getAttendanceSettings` | `attendance_settings` | Policy |
| PATCH | `/admin/settings/attendance` | `api/settings.ts` → `updateAttendanceSettings` | `attendance_settings` | Save policy |
| GET | `/admin/settings/leave-accrual` | `api/settings.ts` → `getLeaveAccrualPolicy` | `leave_accrual_policy` | Accrual |
| PATCH | `/admin/settings/leave-accrual` | `api/settings.ts` → `updateLeaveAccrualPolicy` | `leave_accrual_policy` | Save accrual |

## Security (related)

| Method | Path | FE module | Store key | Notes |
|--------|------|-----------|-----------|-------|
| GET | `/admin/security/events` | `api/security.ts` → `listSecurityEvents` | `security_events` | Security center table |

---

## Store keys seeded for these APIs

| Key | Purpose |
|-----|---------|
| `leave_types` | Leave type settings cards |
| `leave_policies` | Versioned leave policies |
| `leave_ledger` | Append-only ledger rows |
| `audit_logs` | Audit trail |
| `metrics` | Hub / security KPI seeds |
| `offices` | Offices + head options |
| `organization_settings` | Org settings singleton |
| `organization_profile` | Admin org profile form |
| `locations` | Org locations |
| `shifts` | Org shifts |
| `working_weeks` | Working week definitions |
| `holiday_calendars` | Holiday calendars |
| `holidays` | Holiday rows |
| `positions` | Positions list |
| `departments` | Departments list |
| `resources` / `permissions` | RBAC catalog |
| `roles` | RBAC roles |
| `attendance_settings` | Attendance policy |
| `leave_accrual_policy` | Leave accrual policy |
| `security_events` | Security center events |

---

## How to refresh store after seed changes

```bash
cd mock_backend
python seed.py
# or POST /api/v1/admin/_reset when server is running
```

Last updated: 2026-08-24
