# ByteVon CRM - Organization/Admin Module API Shape Alignment Report

**Generated:** September 10, 2026  
**Scope:** Backend (FastAPI/Pydantic) vs Frontend (React/TypeScript) — Organization & Admin modules only  
**Modules Covered:** Organization (departments, locations, shifts, working-weeks, holidays, settings, positions, users), RBAC (roles, permissions, resources), Admin Leave, Audit

---

## Executive Summary

The Organization/Admin module has **64 backend endpoints** across `/organization`, `/rbac`, and `/leave` prefixes, while the frontend makes calls to **~45 distinct endpoint paths** with significant **prefix mismatches** and **missing endpoints**.

### Key Findings

| Category | Count | Status |
|----------|-------|--------|
| Backend endpoints (Organization) | 42 | ✅ Mostly implemented |
| Backend endpoints (RBAC) | 18 | ✅ Fully matched |
| Backend endpoints (Admin Leave) | 3 | ⚠️ Partial match |
| Backend endpoints (Audit) | 4 | ❌ No frontend consumer |
| **Frontend calls matching backend** | 28 | ✅ |
| **Frontend calls with prefix mismatch** | 12 | ⚠️ `/organization/positions` → `/employment/positions` |
| **Frontend calls missing in backend** | 13 | ❌ `/admin/users/*`, `/admin/leave/types`, delete working-week/holiday |

---

## 1. Endpoint Mapping (Organization Module)

### 1.1 Departments — ✅ Well Aligned

| Frontend Call | Backend Endpoint | Status | Shape Notes |
|---------------|------------------|--------|-------------|
| `GET /organization/departments` | `GET /organization/departments` | MATCH | Backend returns `list[DepartmentResponse]`; Frontend expects `{items, total}` |
| `GET /organization/departments/:id` | `GET /organization/departments/{department_id}` | MATCH | |
| `POST /organization/departments` | `POST /organization/departments` | MATCH | |
| `PATCH /organization/departments/:id` | `PATCH /organization/departments/{department_id}` | MATCH | |
| `POST /organization/departments/:id/archive` | `POST /organization/departments/{department_id}/archive` | MATCH | |

**Missing in Backend (called by Workforce module):**
- `GET /workforce/departments/:id/employees` → **Backend HAS**: `GET /organization/departments/{department_id}/employees`
- `GET /workforce/departments/:id/employees-available` → **Backend HAS**: `GET /organization/departments/{department_id}/employees-available`
- `POST /workforce/departments/:id/assign` → **Backend HAS**: `POST /organization/departments/{department_id}/assign`
- `POST /workforce/departments/:id/remove` → **Backend HAS**: `POST /organization/departments/{department_id}/remove`

**Shape Difference (DepartmentResponse):**
```python
# Backend (schemas.py:34-43)
class DepartmentResponse(BaseModel):
    id: int
    name: str
    department_head_employment_id: Optional[int] = None
    is_archived: bool = False
    created_at: datetime
    created_by: Optional[int] = None

# Frontend expects (from types.ts DepartmentListItem inferred)
interface DepartmentListItem {
  id: number
  name: string
  code?: string          # NOT in backend
  headName?: string      # NOT in backend (needs join)
  employeeCount: number  # NOT in backend
  status: string         # Derived from is_archived
  createdAt: string      # created_at (camelCase)
}
```

---

### 1.2 Locations — ✅ Well Aligned

| Frontend Call | Backend Endpoint | Status |
|---------------|------------------|--------|
| `GET /organization/locations` | `GET /organization/locations` | MATCH |
| `GET /organization/locations/:id` | `GET /organization/locations/{location_id}` | MATCH |
| `POST /organization/locations` | `POST /organization/locations` | MATCH |
| `PATCH /organization/locations/:id` | `PATCH /organization/locations/{location_id}` | MATCH |
| `POST /organization/locations/:id/archive` | `POST /organization/locations/{location_id}/archive` | MATCH |

**Shape Difference (LocationResponse):**
```python
# Backend (schemas.py:212-235) - 20 fields
class LocationResponse(BaseModel):
    id: int
    name: str
    timezone: str
    working_week_id: Optional[int]
    holiday_calendar_id: Optional[int]
    latitude: Decimal
    longitude: Decimal
    attendance_radius_meters: int
    allowed_ip_cidrs: List[str]
    country: str
    state: str
    city: str
    address: str
    payroll_region: Optional[str]
    currency: str
    fiscal_year_start_month: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]

# Frontend LocationRow (shared/schema/types.ts:44-67) - 24 fields (snake_case)
# Missing: attendance_radius_meters, allowed_ip_cidrs, payroll_region, fiscal_year_start_month
# Extra: archived_at, archived_by
```

---

### 1.3 Shifts — ✅ Well Aligned

| Frontend Call | Backend Endpoint | Status |
|---------------|------------------|--------|
| `GET /organization/shifts` | `GET /organization/shifts` | MATCH |
| `GET /organization/shifts/:id` | `GET /organization/shifts/{shift_id}` | MATCH |
| `POST /organization/shifts` | `POST /organization/shifts` | MATCH |
| `PATCH /organization/shifts/:id` | `PATCH /organization/shifts/{shift_id}` | MATCH |
| `POST /organization/shifts/:id/archive` | `POST /organization/shifts/{shift_id}/archive` | MATCH |

**Missing in Backend (called by Workforce module):**
- `GET /workforce/shifts/:id/employees` → **Backend HAS**: `GET /organization/shifts/{shift_id}/employees`

**Shape Difference:**
```python
# Backend ShiftResponse (schemas.py:111-126) - time objects
start_time: time
end_time: time
is_overnight: bool
grace_late_minutes: int
flexible_end: bool
break_duration_minutes: Optional[int]

# Frontend ShiftRow (shared/schema/types.ts:88-101)
start_time: string  # "09:00:00"
end_time: string    # "18:00:00"
break_duration_minutes: number | null  # NOT in backend (added in frontend)
```

---

### 1.4 Working Weeks — ⚠️ Missing DELETE

| Frontend Call | Backend Endpoint | Status |
|---------------|------------------|--------|
| `GET /organization/working-weeks` | `GET /organization/working-weeks` | MATCH |
| `DELETE /organization/working-weeks/:id` | **MISSING IN BACKEND** | ❌ Frontend calls this |

**Backend has archive instead:** `POST /working-weeks/{week_id}/archive` with `effective_to` query param

---

### 1.5 Holiday Calendars — ✅ Well Aligned

| Frontend Call | Backend Endpoint | Status |
|---------------|------------------|--------|
| `GET /organization/holiday-calendars` | `GET /organization/holiday-calendars` | MATCH |
| `GET /organization/holiday-calendars/:id` | `GET /organization/holiday-calendars/{calendar_id}` | MATCH |
| `POST /organization/holiday-calendars` | `POST /organization/holiday-calendars` | MATCH |
| `PATCH /organization/holiday-calendars/:id` | `PATCH /organization/holiday-calendars/{calendar_id}` | MATCH |
| `POST /organization/holiday-calendars/:id/archive` | `POST /organization/holiday-calendars/{calendar_id}/archive` | MATCH |

**Holiday Routes (holiday_routes.py):** Additional endpoints exist:
- `GET /holidays/{holiday_id}` ✅
- `PATCH /holidays/{holiday_id}` ✅
- `DELETE /holidays/{holiday_id}` ✅

**Missing in Backend (called by Admin):**
- `DELETE /organization/holidays/:id` → **Backend HAS**: `DELETE /holidays/{holiday_id}` (different path)

---

### 1.6 Organization Settings — ✅ Well Aligned

| Frontend Call | Backend Endpoint | Status |
|---------------|------------------|--------|
| `GET /organization/settings` | `GET /organization/settings` | MATCH |
| `PATCH /organization/settings` | `PUT /organization/settings` + `PATCH` | MATCH (method diff) |

**Shape (OrganizationSettingsResponse):**
```python
# Backend (schemas.py:245-256)
id: int
company_name: str
head_office_location_id: Optional[int]
default_timezone: str
default_currency: str
logo_reference: Optional[str]
created_at: datetime
updated_at: datetime
changed_by: Optional[int]

# Frontend OrganizationSettings (shared/schema/types.ts:32-42)
# Matches but uses snake_case
```

---

### 1.7 Positions — ⚠️ Prefix Mismatch

| Frontend Call | Backend Endpoint | Status |
|---------------|------------------|--------|
| `GET /organization/positions` | `GET /employment/positions` | PREFIX MISMATCH |
| `GET /organization/positions/:id` | `GET /employment/positions/{position_id}` | PREFIX MISMATCH |
| `POST /organization/positions` | `POST /employment/positions` | PREFIX MISMATCH |
| `PATCH /organization/positions/:id` | `PATCH /employment/positions/{position_id}` | PREFIX MISMATCH |
| `POST /organization/positions/:id/archive` | `POST /employment/positions/{position_id}/archive` | PREFIX MISMATCH |

**Backend position routes are in `/employment/positions`** (workforce module), not `/organization/positions`

**Shape (PositionResponse):**
```python
# Backend (workforce/schemas.py:82-90)
id: int
name: str
is_archived: bool
created_at: datetime
updated_at: datetime

# Frontend PositionRow (shared/schema/types.ts:123-129)
id: number
name: string
is_archived: boolean
created_at: string
updated_at: string
# Frontend has NO updated_at/changed_by in PositionRow but backend does
```

---

### 1.8 Admin Users — ❌ Major Gaps

**Backend Endpoints (routes.py:461-601):**
| Backend Endpoint | Frontend Call | Status |
|------------------|---------------|--------|
| `GET /organization/users` | `GET /admin/users` | **PREFIX MISMATCH** + Frontend expects different response shape |
| `GET /organization/employments-without-login` | `GET /admin/employments-without-login` | **PREFIX MISMATCH** |
| `GET /organization/users/{login_id}` | `GET /admin/users/:id` | **PREFIX MISMATCH** |
| `POST /organization/users` | `POST /admin/users` | **PREFIX MISMATCH** |
| `PATCH /organization/users/{login_id}` | `PATCH /admin/users/:id` | **PREFIX MISMATCH** |
| `POST /organization/users/{login_id}/deactivate` | `POST /admin/users/:id/deactivate` | **PREFIX MISMATCH** |
| `POST /organization/users/{login_id}/activate` | `POST /admin/users/:id/activate` | **PREFIX MISMATCH** |
| `POST /organization/users/{login_id}/lock` | `POST /admin/users/:id/lock` | **PREFIX MISMATCH** |
| `POST /organization/users/{login_id}/unlock` | `POST /admin/users/:id/unlock` | **PREFIX MISMATCH** |
| `POST /organization/users/{login_id}/archive` | `POST /admin/users/:id/archive` | **PREFIX MISMATCH** |
| `DELETE /organization/users/{login_id}` | *(same as archive)* | **PREFIX MISMATCH** |

**Critical Shape Difference - AdminUserListResponse:**

```python
# Backend (schemas.py:291-298) - Paginated with metrics
class AdminUserListResponse(BaseModel):
    items: List[AdminUserListItem]
    total: int
    locked: int
    active: int
    departments: List[str] = []
    roles: List[str] = []

class AdminUserListItem(BaseModel):
    id: int
    employmentId: int          # camelCase!
    name: str
    email: str
    role: str
    department: str
    status: str
    lastLogin: str             # camelCase!
    lastLoginAt: Optional[datetime]
    initials: str
    employeeCode: str          # camelCase!
```

```typescript
// Frontend expects (types.ts:198-210) - AdminUserListItem
interface AdminUserListItem {
  id: number
  employmentId: number
  name: string
  email: string
  role: string
  department: string
  status: 'Active' | 'Inactive' | 'Locked'
  lastLogin: string
  lastLoginAt: string | null
  initials: string
  employeeCode: string
}

// Frontend listAdminUsers (users.ts:97-177) expects wrapper:
interface AdminUserListResponse {
  items: AdminUserListItem[]
  total: number
  locked: number
  active: number
  departments: string[]
  roles: string[]
}
```

**✅ Shape Match:** Backend **already uses camelCase** for `AdminUserListItem` fields (`employmentId`, `lastLogin`, `employeeCode`) via manual schema definition. This is the **only schema in the codebase** doing this.

**Missing Fields in Backend Response:**
- `departments: string[]` — list of unique department names for filter dropdown
- `roles: string[]` — list of unique role names for filter dropdown

---

### 1.9 Employment Without Login — ✅ Shape Match

```python
# Backend (schemas.py:300-307) - Already camelCase!
class EmploymentWithoutLogin(BaseModel):
    employmentId: int
    employeeCode: str
    name: str
    department: str
    position: str
    joiningDate: Optional[date] = None

# Frontend (types.ts:212-219)
interface EmploymentWithoutLogin {
  employmentId: number
  employeeCode: string
  name: string
  department: string
  position: string
  joiningDate: string
}
```

---

## 2. RBAC Module — ✅ Fully Aligned

| Frontend Call | Backend Endpoint | Status |
|---------------|------------------|--------|
| `GET /rbac/resources` | `GET /rbac/resources` | MATCH |
| `GET /rbac/permissions` | `GET /rbac/permissions` | MATCH |
| `GET /rbac/roles` | `GET /rbac/roles` | MATCH |
| `GET /rbac/roles/:id` | `GET /rbac/roles/{role_id}` | MATCH |
| `POST /rbac/roles` | `POST /rbac/roles` | MATCH |
| `PATCH /rbac/roles/:id` | `PATCH /rbac/roles/{role_id}` | MATCH |
| `DELETE /rbac/roles/:id` | `DELETE /rbac/roles/{role_id}` | MATCH |

**Shape Difference (RoleResponse vs AdminRole):**

```python
# Backend RoleResponse (schemas.py:82-91)
id: int
name: str
description: Optional[str]
is_system_role: bool
created_at: datetime
changed_by: Optional[int]

# Backend RoleDetailResponse (schemas.py:107-115) - Includes permissions
permissions: List[RolePermissionResponse]
permission_details: List[RolePermissionDetail]  # Has `key: "users.view"`
permission_keys: List[str]                      # ["users.view", "leads.create"]
sensitive_field_permissions: List[...]

# Frontend AdminRole (types.ts:33-45) - Different shape
interface AdminRole {
  id: string              # "R-01" vs int
  name: string
  description: string
  usersCount: number      # NOT in backend
  permissions: string[]   # ["users.view"] - matches permission_keys
  status: 'Active' | 'Archived'
  category: 'Core Role' | 'Operational' | 'Financial' | 'Standard'
  coveragePct: number
  coverageLabel: string
  created: string         # "Jan 01, 2025"
  updated: string
}
```

**Frontend Normalization (roles.ts:35-56):**
- Maps `permission_keys` → `permissions` (string[])
- Computes `usersCount`, `coveragePct`, `coverageLabel` client-side
- Maps `is_system_role` → `category`
- Formats dates to locale strings

**EffectivePermissionsResponse — ✅ Well Aligned:**
```python
# Backend (schemas.py:189-211) - Already uses serialization_alias!
employment_id: int = Field(..., serialization_alias="employmentId")
is_super_admin: bool = Field(False, serialization_alias="isSuperAdmin")
scope_by_resource: dict = Field(..., serialization_alias="scopeByResource")
```

---

## 3. Admin Leave — ⚠️ Path & Shape Mismatch

| Frontend Call | Backend Endpoint | Status |
|---------------|------------------|--------|
| `GET /admin/leave/types` | **MISSING** (Backend has `/leave/policies`) | ❌ |
| `GET /admin/leave/policies` | `GET /leave/policies` | MATCH (different prefix) |
| `GET /admin/leave/ledger` | `GET /leave/ledger/{employment_id}` | PARTIAL (requires employment_id) |

**Shape Difference (LeavePolicyResponse vs LeavePolicyRow):**

```python
# Backend (leave/schemas.py:32-43)
class LeavePolicyResponse(BaseModel):
    id: int
    name: str
    leave_type: LeaveType
    annual_entitlement: Decimal
    carry_forward_limit: Optional[Decimal]
    effective_from: date
    effective_to: Optional[date]
    created_at: datetime
    changed_by: Optional[int]

# Frontend LeavePolicyRow (types.ts:107-115)
interface LeavePolicyRow {
  id: number
  name: string
  leave_type: string
  annual_entitlement: number
  carry_forward_limit: number
  effective_from: string
  effective_to: string | null
}
```

**Frontend Derives LeaveTypeSettingRow from Policies (leave.ts:57-70):**
```typescript
// Frontend creates "Leave Types" table from current policies
interface LeaveTypeSettingRow {
  name: string
  desc: string
  days: string
  eligibility: string
  eligibilityStyle: string
}
```

---

## 4. Admin Audit — ❌ No Backend Consumer

**Backend Endpoints (audit/routes.py - not shown but from API_ANALYSIS_REPORT):**
- `GET /audit/logs` — 4 endpoints total
- **Frontend calls:** `GET /audit/logs` (audit.ts:187)

**Shape Difference:**

```python
# Backend AuditLogResponse (inferred)
id: int
reference_type: str
reference_id: int
action: str
description: str
employment_id: Optional[int]
ip_address: Optional[str]
user_agent: Optional[str]
created_at: datetime

# Frontend AuditLog (types.ts:52-77) - Much richer
interface AuditLog {
  id: string
  action: string
  description: string
  referenceType: string
  referenceId: number | null
  employmentId: number | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  timestamp: string          # Formatted display
  actor: string              # Derived
  actorInitials: string      # Derived
  target: string             # Derived
  module: string             # Alias of referenceType
  ip: string                 # Alias of ipAddress
}
```

**Frontend maps extensively** (audit.ts:98-129) with derived fields.

---

## 5. Summary of Shape Differences

### 5.1 Casing Convention

| Schema | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| `DepartmentResponse` | snake_case | camelCase | Manual mapping needed |
| `LocationResponse` | snake_case | camelCase | Manual mapping needed |
| `ShiftResponse` | snake_case + `time` | camelCase + string | Time serialization |
| `WorkingWeekResponse` | snake_case | camelCase | |
| `HolidayCalendarResponse` | snake_case | camelCase | |
| `HolidayResponse` | snake_case | camelCase | |
| `OrganizationSettingsResponse` | snake_case | camelCase | |
| `AdminUserListItem` | **camelCase** | camelCase | ✅ Already aligned |
| `EmploymentWithoutLogin` | **camelCase** | camelCase | ✅ Already aligned |
| `RoleResponse` | snake_case | camelCase | |
| `RoleDetailResponse` | snake_case + `permission_keys` | camelCase | Frontend uses `permission_keys` |
| `EffectivePermissionsResponse` | **camelCase via alias** | camelCase | ✅ Already aligned |
| `LeavePolicyResponse` | snake_case | camelCase | |

### 5.2 Date/Time Serialization

| Backend Type | Current JSON | Frontend Expects | Fix |
|--------------|--------------|------------------|-----|
| `date` | `"2026-01-15"` | `"2026-01-15"` | ✅ OK |
| `datetime` | `"2026-01-15T10:30:00"` | `"2026-01-15T10:30:00Z"` | Add `Z` suffix |
| `time` | `"09:00:00"` | `"09:00:00"` | ✅ OK |

### 5.3 Response Wrappers

| Endpoint | Backend Returns | Frontend Expects |
|----------|-----------------|------------------|
| List endpoints | `List[Model]` | `{items: Model[], total: number}` |
| `/organization/users` | `AdminUserListResponse` (has wrapper) | ✅ Matches |
| `/rbac/roles` | `List[RoleResponse]` | `{items, total}` |

---

## 6. Required Changes

### Priority 1: Add Missing Endpoints (Backend)

| Endpoint | Module | Effort |
|----------|--------|--------|
| `DELETE /organization/working-weeks/{id}` | Organization | Low (reuse archive logic) |
| `DELETE /organization/holidays/{id}` | Organization | Low (exists at `/holidays/{id}`) |
| `GET /organization/users` → alias `/admin/users` | Organization | Low (add router prefix alias) |
| `POST /organization/users` → alias `/admin/users` | Organization | Low |
| `PATCH /organization/users/{id}` → alias `/admin/users/{id}` | Organization | Low |
| Action endpoints (`/deactivate`, `/activate`, `/lock`, `/unlock`, `/archive`) | Organization | Low |

### Priority 2: Fix Prefix Mismatches

| Frontend Path | Backend Path | Solution |
|---------------|--------------|----------|
| `/organization/positions/*` | `/employment/positions/*` | **Option A:** Add `/organization/positions` proxy routes in Organization router<br>**Option B:** Frontend changes to `/employment/positions` |
| `/admin/users/*` | `/organization/users/*` | **Option A:** Add `/admin/users` router with same handlers<br>**Option B:** Frontend changes to `/organization/users` |
| `/admin/leave/types` | `/leave/policies` (derived) | Add `GET /admin/leave/types` returning `LeaveTypeSettingRow[]` |
| `/admin/leave/ledger` | `/leave/ledger/{employment_id}` | Add `GET /admin/leave/ledger` with query param `employment_id` |

### Priority 3: Standardize Serialization (All Schemas)

**Apply to ALL Organization schemas (DepartmentResponse, LocationResponse, ShiftResponse, WorkingWeekResponse, HolidayCalendarResponse, HolidayResponse, OrganizationSettingsResponse, PositionResponse):**

```python
# Add to each model or create base class
from pydantic import ConfigDict, Field

class BaseOrgSchema(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
        from_attributes=True,
    )

# Example: DepartmentResponse
class DepartmentResponse(BaseOrgSchema):
    id: int
    name: str
    department_head_employment_id: Optional[int] = Field(None, serialization_alias="departmentHeadEmploymentId")
    is_archived: bool = Field(False, serialization_alias="isArchived")
    created_at: datetime = Field(..., serialization_alias="createdAt")
    created_by: Optional[int] = Field(None, serialization_alias="createdBy")

    @field_serializer('created_at')
    def serialize_dt(self, v: datetime) -> str:
        return v.isoformat() + 'Z'
```

### Priority 4: Add Pagination Wrapper to List Endpoints

```python
# Create generic wrapper
from typing import Generic, List, TypeVar
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int = 1
    page_size: int = 20

# Update list endpoints:
@router.get("/departments", response_model=PaginatedResponse[DepartmentResponse])
async def list_departments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    include_archived: bool = Query(False),
) -> PaginatedResponse[DepartmentResponse]:
    items, total = await service.list_departments_paginated(page, page_size, include_archived)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)
```

### Priority 5: Enrich Admin User Response

Add `departments: List[str]` and `roles: List[str]` to `AdminUserListResponse` for filter dropdowns.

---

## 7. Frontend Cleanup (After Backend Changes)

Once backend returns camelCase with proper wrappers:

1. **Remove** `asList()` helper in `organization.ts` (lines 17-27)
2. **Remove** manual camelCase mapping in `users.ts` (lines 99-121)
3. **Use direct type assertions** for `AdminUserListResponse`, `DepartmentResponse`, etc.
4. **Consolidate** duplicate type definitions (frontend `DepartmentListItem` vs backend `DepartmentResponse`)

---

## 8. Files Reference

### Backend
- `02_backend_code/app/modules/organization/schemas/schemas.py` — All Organization schemas
- `02_backend_code/app/modules/organization/routes.py` — Organization routes (42 endpoints)
- `02_backend_code/app/modules/organization/holiday_routes.py` — Holiday routes (10 endpoints)
- `02_backend_code/app/modules/rbac/routes.py` — RBAC routes (18 endpoints)
- `02_backend_code/app/modules/leave/routes.py` — Leave routes (used by admin)

### Frontend
- `01_frontend_code/src/modules/admin/api/organization.ts` — 30 API functions
- `01_frontend_code/src/modules/admin/api/users.ts` — Admin users API
- `01_frontend_code/src/modules/admin/api/roles.ts` — RBAC roles API
- `01_frontend_code/src/modules/admin/api/leave.ts` — Admin leave API
- `01_frontend_code/src/modules/admin/api/audit.ts` — Audit API
- `01_frontend_code/src/modules/admin/types.ts` — All admin types
- `01_frontend_code/src/shared/schema/types.ts` — Shared schema types (LocationRow, ShiftRow, etc.)

---

## Next Steps

1. **Agree on prefix strategy** — Add `/admin/*` aliases or migrate frontend to `/organization/*`
2. **Implement serialization base class** for Organization module schemas
3. **Add pagination wrapper** to all list endpoints
4. **Implement 3 missing endpoints** (delete working-week, delete holiday, leave types)
5. **Test with frontend** using `env.useMockApi = false`

*This report covers Organization/Admin module only. See `API_SHAPE_ALIGNMENT_REPORT.md` for full application analysis.*