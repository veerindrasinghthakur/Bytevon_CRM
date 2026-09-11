# ByteVon CRM - API Response/Request Shape Alignment Report

**Generated:** September 10, 2026  
**Scope:** Backend (FastAPI/Pydantic) vs Frontend (React/TypeScript) data shape comparison  
**Purpose:** Document current shape differences and provide alignment recommendations before integration work begins

---

## Executive Summary

This report analyzes the **data shapes** (field names, types, nested structures) of API requests/responses between:
- **Backend:** 02_backend_code/app/modules/*/schemas/schemas.py (Pydantic v2 models)
- **Frontend:** 01_frontend_code/src/modules/*/types.ts + src/shared/schema/types.ts (TypeScript interfaces)

**Key Finding:** While field names mostly align conceptually, there are significant differences in:
1. **Casing conventions** (snake_case backend vs camelCase frontend)
2. **Nested object structures** (backend flat vs frontend nested DTOs)
3. **Date handling** (backend date/datetime objects vs frontend ISO strings)
4. **Enum handling** (backend Python enums vs frontend const objects)
5. **Pagination/response wrappers** (different structures)

---

## 1. Casing Convention Mismatch

### Backend (snake_case)
```python
# Pydantic models use snake_case
class EmployeeSalaryResponse(BaseModel):
    employee_id: int
    effective_from: date
    effective_to: Optional[date]
    gross_salary: Decimal
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]
    items: List[EmployeeSalaryItemResponse]
```

### Frontend (camelCase)
```typescript
// TypeScript interfaces use camelCase
export interface SalaryStructure {
  employeeId: string
  effectiveFrom: string
  effectiveTo: string | null
  currency: string
  payFrequency: string
  status: string
  items: SalaryItem[]
}
```

### Impact
- Frontend API layer must manually map every field (see `mapApiEmployment`, `mapApiEmployeeDetail` in employment.ts)
- Error-prone, verbose, maintenance burden
- Inconsistent mapping across modules

### Recommendation
**Standardize on camelCase for JSON serialization** using Pydantic's `ConfigDict(populate_by_name=True, ser_json_by_alias=True)` with `Field(..., serialization_alias="camelCase")` on all models.

---

## 2. Date/DateTime Handling

### Backend
```python
# Pydantic native types
joining_date: date                    # date only
created_at: datetime                  # full datetime
effective_from: date
effective_to: Optional[date]
```

### Frontend
```typescript
// ISO strings
joining_date: string                  // "2026-01-15"
created_at: string                    // "2026-01-15T10:00:00Z"
effectiveFrom: string                 // "2024-01-01"
effectiveTo: string | null            // "2024-12-31" | null
```

### Current Frontend Mapping (employment.ts:219-221)
```typescript
joining_date: String(raw.joining_date ?? raw.joiningDate ?? ''),
created_at: String(raw.created_at ?? raw.createdAt ?? ''),
updated_at: String(raw.updated_at ?? raw.updatedAt ?? ''),
```

### Recommendation
- Backend: Serialize dates as ISO 8601 strings (`date` → `"YYYY-MM-DD"`, `datetime` → `"YYYY-MM-DDTHH:mm:ssZ"`)
- Use Pydantic `@field_serializer` for consistent formatting
- Frontend: Keep as strings, parse with `new Date()` only when needed for UI

---

## 3. Module-by-Module Shape Comparison

### 3.1 Workforce / Employment

#### Backend: `EmploymentDetailResponse` (schemas.py:181-189)
```python
class EmploymentDetailResponse(EmploymentResponse):
    current_assignment: Optional[EmploymentAssignmentResponse] = None
    recent_state_history: List[EmploymentStateHistoryResponse] = []
    person: Optional[PersonResponse] = None
```

#### Frontend: `EmployeeDetailDto` (shared/schema/types.ts:299-314)
```typescript
export interface EmployeeDetailDto {
  employment: EmploymentRow
  person: PersonRow
  currentAssignment: EmploymentAssignmentRow | null
  department: DepartmentRow | null
  position: PositionRow | null
  location: LocationRow | null
  shift: ShiftRow | null
  stateHistory: EmploymentStateHistoryRow[]
  assignmentHistory: EmploymentAssignmentRow[]
  roleIds: number[]
  roleNames: string[]
  currentSalary: EmployeeSalaryRow | null
  hasLogin: boolean
  loginEmail: string | null
}
```

#### Differences
| Aspect | Backend | Frontend |
|--------|---------|----------|
| Structure | Nested objects | Flattened + extra fields |
| Assignment | `current_assignment` only | `currentAssignment` + `assignmentHistory` |
| Department/Position/Location | Not included | Separate expanded objects |
| Roles | Not included | `roleIds`, `roleNames` |
| Salary | Not included | `currentSalary` |
| Login | Not included | `hasLogin`, `loginEmail` |

#### Frontend Mapping Logic (employment.ts:201-283)
- Manual mapping of 50+ fields
- Handles both `snake_case` and `camelCase` from backend
- Builds `department`, `position`, `location`, `shift` from assignment IDs

---

### 3.2 Payroll

#### Backend: `MonthlyPayrollResponse` (schemas.py:93-113)
```python
class MonthlyPayrollResponse(BaseModel):
    id: int
    employment_id: int
    year: int
    month: int
    gross_salary: Decimal
    total_earnings: Decimal
    total_deductions: Decimal
    net_salary: Decimal
    status: PayrollStatus
    payment_method: Optional[str]
    payment_reference: Optional[str]
    payment_date: Optional[date]
    payable_days: Optional[Decimal]
    lop_days: Optional[Decimal]
    items: List[MonthlyPayrollItemResponse]
```

#### Frontend: `PayrollEmployeeRow` (shared/mock/data/payroll.ts:33-47)
```typescript
export const payrollEmployees: PayrollEmployeeRow[] = [
  {
    id: 'e1',                    // string vs int
    name: 'Sarah Jenkins',       // not in backend
    code: 'BT-092',              // employee_code
    role: 'Senior Engineer',     // not in backend
    department: 'Engineering',   // not in backend
    initials: 'SJ',              // computed
    gross: 8500,                 // gross_salary
    earnings: 1200,              // total_earnings
    deductions: 950,             // total_deductions
    net: 8750,                   // net_salary
    status: 'Approved',          // status (enum string)
    currency: 'USD',             // not in backend
    effectiveFrom: '2024-01-01', // effective_from
    salaryStatus: 'ACTIVE',      // not in backend
  }
]
```

#### Differences
| Field | Backend | Frontend | Notes |
|-------|---------|----------|-------|
| ID | `int` | `string` | Frontend uses string IDs |
| Employee info | `employment_id` only | `name`, `code`, `role`, `dept`, `initials` | Frontend enriches |
| Currency | Not present | `currency` | Frontend assumes USD |
| Status | `PayrollStatus` enum | String `'Approved'/'Calculated'/'Paid'` | Enum vs string |
| Decimal | `Decimal` | `number` | Precision loss risk |

#### Missing Backend Endpoints (per API_ANALYSIS_REPORT.md)
- `/payroll/kpis`, `/payroll/period`, `/payroll/employees` - frontend expects these but backend has `/payroll/salaries` and `/payroll` (monthly payroll list)

---

### 3.3 Leave

#### Backend: `LeaveBalanceResponse` (schemas.py:117-120)
```python
class LeaveBalanceResponse(BaseModel):
    employment_id: int
    balances: List[LeaveBalanceItem]  // { leave_type: LeaveType, balance_days: Decimal }
```

#### Frontend: `ApplyLeaveBalanceItem` (shared/mock/data/payroll.ts:144-151)
```typescript
export interface ApplyLeaveBalanceItem {
    leave_type: LeaveType
    used: Decimal
    total: Decimal
    remaining: Decimal
}
```

#### Backend: `ApplyLeaveContextResponse` (schemas.py:153-164)
```python
class ApplyLeaveContextResponse(BaseModel):
    employment_id: int
    holidays: List[HolidayItem]           // { date, name, holiday_type }
    leave_types: List[LeaveTypeOptionItem] // { leave_type, name, annual_entitlement, description }
    balances: List[ApplyLeaveBalanceItem]  // { leave_type, used, total, remaining }
```

#### Frontend expects (my-work.ts:93)
```typescript
GET /my-work/leave/apply-context  // MISSING IN BACKEND
```

#### Differences
- Backend has `/leave/apply-context/{employment_id}` but frontend calls `/my-work/leave/apply-context`
- Frontend expects `used/total/remaining` breakdown; backend returns `balance_days` only
- Backend returns `LeaveBalanceItem` with `balance_days: Decimal`; frontend expects computed `used/total/remaining`

---

### 3.4 Attendance

#### Backend: `AttendanceDayResponse` (schemas.py:59-70)
```python
class AttendanceDayResponse(BaseModel):
    id: int
    employment_id: int
    shift_id: Optional[int]
    attendance_date: date
    status: AttendanceStatus
    working_hours: Optional[Decimal]
    created_at: datetime
    updated_at: datetime
```

#### Backend: `AttendanceDayDetailResponse` (schemas.py:72-74)
```python
class AttendanceDayDetailResponse(AttendanceDayResponse):
    punches: List[PunchResponse] = []
```

#### Frontend: `AttendanceDayDetailData` (workforce/types.ts:197-219)
```typescript
export interface AttendanceDayDetailData {
  employmentId: string
  date: string
  punches: AttendancePunch[]
  breaks: AttendanceBreak[]
  workingHours: number
}

export interface AttendancePunch {
  id: number
  punch_type: string
  punch_time: string
  is_valid_punch: boolean
  client_ip: string
  validation_message: string | null
}
```

#### Differences
- Backend uses `employment_id` (int), frontend uses `employmentId` (string)
- Backend returns `working_hours: Decimal`, frontend uses `workingHours: number`
- Frontend expects `breaks` array; backend has separate `/breaks` endpoints
- Frontend `date` is string; backend `attendance_date` is `date` type

---

### 3.5 Sales / CRM

#### Backend: `LeadResponse` (schemas.py:162-181)
```python
class LeadResponse(BaseModel):
    id: int
    lead_title: string
    platform_id: Optional[int]
    contact_name: string
    email: Optional[string]
    phone: Optional[string]
    quotation: Optional[Decimal]
    expected_close_date: Optional[date]
    assigned_employment_id: Optional[int]
    status: LeadStatus
    description: Optional[string]
    client_id: Optional[int]
    auto_create_project: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]
```

#### Frontend: `Lead` (sales/types.ts:34-62)
```typescript
export interface Lead {
  id: string
  title: string              // lead_title
  contactName: string        // contact_name
  contactTitle?: string
  company: string            // NOT in backend LeadResponse
  industry?: string
  email?: string
  phone?: string
  source: string             // NOT in backend
  priority: LeadPriority
  status: RecordStatus       // Active/Inactive (different from LeadStatus)
  stage: PipelineStage
  budget: number             // quotation
  probability?: number
  date?: string
  assignedTo?: string        // assigned_employment_id → name
  assignedAvatar?: string
  platform?: string
  tags?: string[]
  caseStudy?: string
  createdAt: string
  notes?: string
  chatLink?: string
}
```

#### Major Differences
| Backend Field | Frontend Field | Notes |
|---------------|----------------|-------|
| `lead_title` | `title` | Rename |
| `contact_name` | `contactName` | CamelCase |
| `quotation` | `budget` | Different semantic |
| `expected_close_date` | `date` | Different name |
| `assigned_employment_id` | `assignedTo` (string name) | Frontend enriches |
| `status` (LeadStatus enum) | `status` (RecordStatus) + `stage` (PipelineStage) | Different enums |
| `auto_create_project` | Not in frontend | |
| `platform_id` | `platform` (string) | Frontend enriches |

#### Missing Backend Fields
- `company`, `industry`, `source`, `priority`, `probability`, `tags`, `caseStudy`, `chatLink`

---

### 3.6 Projects / Tasks

#### Backend: `ProjectResponse` (schemas.py:101-122)
```python
class ProjectResponse(BaseModel):
    id: int
    client_id: int
    lead_id: Optional[int]
    project_name: string
    description: Optional[string]
    assignment_type: ProjectAssignmentType
    assigned_to_id: int
    repository_reference: Optional[string]
    status: ProjectStatus
    phase: ProjectPhase
    created_from: ProjectSource
    planned_start_date: Optional[date]
    planned_end_date: Optional[date]
    actual_start_date: Optional[date]
    actual_end_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]
```

#### Frontend: `ProjectListItem` / `ProjectDetail` (projects/schemas/project.ts)
```typescript
export interface ProjectListItem {
  id: number
  projectName: string
  clientId: number
  clientName: string
  status: ProjectStatus
  phase: ProjectPhase
  progress: number
  teamCount: number
  taskCount: number
  startDate: string | null
  endDate: string | null
}
```

#### Differences
- Frontend includes computed fields: `clientName`, `progress`, `teamCount`, `taskCount`
- Backend has `assignment_type`, `assigned_to_id`, `repository_reference`, `created_from` not in frontend list item
- Date fields: backend `date` vs frontend `string | null`

---

### 3.7 Notifications

#### Backend: `NotificationResponse` (schemas.py:92-109)
```python
class NotificationResponse(BaseModel):
    id: int
    recipient_type: NotificationRecipientType
    recipient_id: int
    template_id: Optional[int]
    title: string
    body: string
    payload: Dict[str, Any]
    channel: NotificationChannel
    action: NotificationAction
    status: NotificationStatus
    read_at: Optional[datetime]
    archived_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
```

#### Frontend: `AppNotification` (notifications/schemas/notification.ts)
```typescript
export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string           // body
  timestamp: string         // created_at
  read: boolean             // status === 'READ'
  actionUrl?: string
  actionLabel?: string
  payload?: Record<string, unknown>
  priority: NotificationPriority
  module?: string
}
```

#### Differences
- Backend has `recipient_type`, `recipient_id`, `template_id`, `channel`, `action`, `archived_at`, `expires_at`
- Frontend has simplified: `read` boolean, `actionUrl`, `actionLabel`, `priority`, `module`
- Different status enums

---

### 3.8 Approvals

#### Backend: `ApprovalRequestResponse` (schemas.py:56-68)
```python
class ApprovalRequestResponse(BaseModel):
    id: int
    request_type: string
    reference_id: int
    requester_employment_id: int
    target: ApprovalTarget
    target_department_id: Optional[int]
    status: ApprovalStatus
    created_at: datetime
    updated_at: datetime
```

#### Frontend: Expected from API_ANALYSIS_REPORT
- `/approvals/kpis` - MISSING
- `/approvals/my-requests` - MISSING
- `/approvals/approvers` - MISSING

---

### 3.9 RBAC / Auth

#### Backend: `EffectivePermissionsResponse` (schemas.py:189-211)
```python
class EffectivePermissionsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    employment_id: int = Field(..., serialization_alias="employmentId")
    is_super_admin: bool = Field(False, serialization_alias="isSuperAdmin")
    roles: List[str] = []
    permissions: dict[str, dict[str, bool]] = {}  // { "lead": { "view": true } }
    scope: string = "SELF"
    scope_by_resource: dict[str, string] = Field(default_factory=dict, serialization_alias="scopeByResource")
    grants: List[EffectivePermissionItem] = []
```

#### Frontend: `EffectiveAuthorization` (shared/rhbac/types.ts - inferred)
```typescript
// Frontend expects camelCase with nested permissions structure
interface EffectiveAuthorization {
  employmentId: number
  isSuperAdmin: boolean
  roles: string[]
  permissions: Record<string, Record<string, boolean>>
  scope: string
  scopeByResource: Record<string, string>
  grants: Array<{ resourceName: string; action: string; scopeName: string }>
}
```

#### Status: ✅ **Well-aligned** - Backend already uses `serialization_alias` for camelCase

---

## 4. URL Prefix Misalignment

| Frontend Prefix | Backend Prefix | Modules Affected |
|-----------------|----------------|------------------|
| `/workforce/*` | `/employment/*`, `/organization/*` | Employment, Departments |
| `/projects/*` | `/developer/*` | Projects, Teams, Tasks |
| `/my-work/*` | Various | My Work (aggregation) |
| `/admin/*` | `/rbac/*`, `/organization/*` | Admin |
| `/payroll/*` | `/payroll/*` (different structure) | Payroll |

---

## 5. Pagination & List Response Shapes

### Backend Pattern
```python
# Most endpoints return bare lists
@router.get("/employments", response_model=list[EmploymentResponse])
async def list_employments(...) -> list[EmploymentResponse]:
```

### Frontend Expectation (employment.ts:121-126)
```typescript
const { data } = await apiClient.get<
  Array<Record<string, unknown>> | {
    items?: Array<Record<string, unknown>>
    total?: number
    metrics?: ReturnType<typeof buildMetrics>
  }
>('/workforce/employments', { params: { state: stateFilter, limit, offset: 0 } })
```

### Frontend Standard Response Wrapper (shared/lib/list-params.ts)
```typescript
export interface EntityListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  metrics?: unknown
}
```

### Recommendation
Backend should return consistent paginated response:
```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
```

---

## 6. Enum Serialization

### Backend (Python enums)
```python
class EmploymentState(str, Enum):
    ONBOARDING = "ONBOARDING"
    PROBATION = "PROBATION"
    CONFIRMED = "CONFIRMED"
```

### Frontend (const objects)
```typescript
export const EmploymentState = {
  ONBOARDING: 'ONBOARDING',
  PROBATION: 'PROBATION',
  CONFIRMED: 'CONFIRMED',
} as const
export type EmploymentState = (typeof EmploymentState)[keyof typeof EmploymentState]
```

### Current State: ✅ **Values match** (both use uppercase strings)
### Issue: Frontend duplicates enum definitions; should import from shared schema

---

## 7. Error Response Shapes

### Backend (core/exceptions/handlers.py)
```python
class ErrorResponse(BaseModel):
    error: string
    message: string
    details: Optional[dict]
    status_code: int
```

### Frontend Expectation
- Uses Axios interceptors to extract error message
- Expects consistent error shape across all endpoints

---

## 8. Summary of Required Changes

### Priority 1: Backend Serialization (High Impact, Low Effort)
1. **Add camelCase serialization aliases** to all Pydantic models
2. **Add date serializers** for consistent ISO string output
3. **Standardize paginated response wrapper** for all list endpoints

### Priority 2: Missing Endpoints (High Impact, Medium Effort)
| Module | Missing Endpoints |
|--------|-------------------|
| Payroll | 13 endpoints (kpis, period, employees, preview, run, approve, payslip, review) |
| Notifications | 9 endpoints (inbox/all, sent, triggers, channels, drafts, read-all, archive-read, update) |
| Admin Users | 11 endpoints (users CRUD, lock/unlock, employments-without-login) |
| My Work | 9 endpoints (overview, apply-context, calculate, today-info, week-hours, correction-candidates, corrections, approvers, holidays) |
| Approvals | 4 endpoints (kpis, my-requests, approvers) |
| Workforce Departments | 6 endpoints (employees, employees-available, assign, remove, employment-options, shift-employees) |
| Workforce Attendance | 5 endpoints (dashboard, today, detail, corrections) |
| Sales | 6 endpoints (filter-options, case-studies, activities, metrics, sales-reps) |

### Priority 3: URL Prefix Alignment (Medium Impact)
- **Option A (Recommended):** Frontend adapts to backend paths
- **Option B:** Backend adds proxy routes with frontend prefixes

### Priority 4: Data Shape Enrichment (Medium Impact)
- Backend `EmploymentDetailResponse` should include department, position, location, shift, roles, salary, login
- Backend payroll endpoints should return enriched employee data (name, role, department)
- Backend lead response should include company, source, priority, probability, tags

---

## 9. Implementation Plan

### Phase 1: Serialization Standardization (Week 1)
```python
# Add to all schemas/base.py or each schema file
from pydantic import ConfigDict, Field

class BaseSchema(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
        from_attributes=True,
    )

# Example usage
class EmploymentResponse(BaseSchema):
    id: int
    person_id: int = Field(..., serialization_alias="personId")
    employee_code: str = Field(..., serialization_alias="employeeCode")
    employment_type: EmploymentType = Field(..., serialization_alias="employmentType")
    current_state: EmploymentState = Field(..., serialization_alias="currentState")
    joining_date: date = Field(..., serialization_alias="joiningDate")
    created_at: datetime = Field(..., serialization_alias="createdAt")
    updated_at: datetime = Field(..., serialization_alias="updatedAt")
    changed_by: Optional[int] = Field(None, serialization_alias="changedBy")

    @field_serializer('joining_date')
    def serialize_date(self, v: date) -> str:
        return v.isoformat()

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, v: datetime) -> str:
        return v.isoformat()
```

### Phase 2: Add Missing Endpoints (Week 2-3)
Follow priority order from API_ANALYSIS_REPORT.md

### Phase 3: Data Enrichment in Backend Responses (Week 3-4)
- Modify `EmploymentDetailResponse` to include related entities
- Add computed fields to payroll responses
- Extend lead/client responses with frontend-expected fields

### Phase 4: Frontend Cleanup (Week 4+)
- Remove manual mapping functions (`mapApiEmployment`, `mapApiEmployeeDetail`)
- Use direct type assertions with camelCase backend responses
- Consolidate enum imports from `@/shared/schema`

---

## 10. TypeScript ↔ Python Type Mapping Reference

| Python (Pydantic) | TypeScript | Notes |
|-------------------|------------|-------|
| `int` | `number` | |
| `float` / `Decimal` | `number` | Precision: use string for money if critical |
| `str` | `string` | |
| `bool` | `boolean` | |
| `date` | `string` | ISO: "YYYY-MM-DD" |
| `datetime` | `string` | ISO: "YYYY-MM-DDTHH:mm:ssZ" |
| `Optional[T]` | `T \| null` | |
| `List[T]` | `T[]` | |
| `Dict[str, Any]` | `Record<string, unknown>` | |
| `Enum` | `const object` + `type` | Values must match exactly |
| `BaseModel` | `interface` | Use `serialization_alias` for camelCase |

---

## 11. Files to Reference

### Backend Schemas
- `02_backend_code/app/modules/workforce/schemas/schemas.py`
- `02_backend_code/app/modules/payroll/schemas/schemas.py`
- `02_backend_code/app/modules/leave/schemas/schemas.py`
- `02_backend_code/app/modules/attendance/schemas/schemas.py`
- `02_backend_code/app/modules/sales/schemas/schemas.py`
- `02_backend_code/app/modules/project/schemas/schemas.py`
- `02_backend_code/app/modules/notifications/schemas/schemas.py`
- `02_backend_code/app/modules/approvals/schemas/schemas.py`
- `02_backend_code/app/modules/rbac/schemas/schemas.py`
- `02_backend_code/app/modules/auth/schemas/schemas.py`

### Frontend Types
- `01_frontend_code/src/shared/schema/types.ts`
- `01_frontend_code/src/shared/schema/enums.ts`
- `01_frontend_code/src/modules/workforce/types.ts`
- `01_frontend_code/src/modules/payroll/types.ts`
- `01_frontend_code/src/modules/sales/types.ts`
- `01_frontend_code/src/modules/projects/types.ts`
- `01_frontend_code/src/modules/notifications/types.ts`
- `01_frontend_code/src/modules/my-work/types.ts`

### API Mapping
- `API_ANALYSIS_REPORT.md` - Endpoint-level mapping
- `API_ENDPOINT_MAPPING.csv` - Row-by-row mapping

---

## Next Steps

1. **Review this document** with backend and frontend leads
2. **Agree on serialization strategy** (camelCase aliases + ISO dates)
3. **Prioritize missing endpoints** per Phase 1-3 above
4. **Create shared type definitions** (possibly generate TS types from Pydantic)
5. **Begin implementation** starting with serialization changes

---

*This report is a living document. Update as alignment work progresses.*