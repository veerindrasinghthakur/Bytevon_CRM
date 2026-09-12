# Admin Module - Error & Response Handling Analysis Report

## Executive Summary

The admin module has **basic but inconsistent** error handling. It uses a shared `getApiErrorMessage` utility for parsing backend errors, but error handling is implemented ad-hoc per hook/page with no centralized strategy. Key gaps: silent failures in list queries, inconsistent error display in UI, no toast/notification system, and missing error boundaries.

---

## Current Architecture

### 1. Shared Error Parsing Utility (`src/shared/lib/api-error.ts`)

**Strengths:**
- Centralized `getApiErrorMessage(err, fallback)` and `parseApiError(err, fallback)` functions
- Handles multiple backend error formats:
  - AppException envelope: `{ error: { code, message, details } }`
  - FastAPI validation: `{ detail: string | ValidationError[] }`
  - Legacy: `{ message: string }`
- HTTP status code fallbacks (401, 403, 404, 409, 422, 500+)
- Returns typed `ParsedApiError` with `message`, `code`, `status`, `details`

**Limitations:**
- No support for retry-after headers or rate limiting
- No structured error codes for frontend routing (e.g., redirect on 401)
- Fallback messages are generic, not context-aware

---

### 2. API Layer Patterns (`src/modules/admin/api/*.ts`)

| File | Error Handling Pattern | Issues |
|------|------------------------|--------|
| `users.ts` | `try/catch` + `throw new Error(extractApiErrorMessage(...))` | Consistent for mutations; list queries have no error handling |
| `roles.ts` | `try/catch` in `getAdminRole` returns `null`; mutations throw | `listAdminRoles` has no try/catch - errors bubble as unhandled promise rejections |
| `settings.ts` | `try/catch` returns defaults (`DEFAULT_ATTENDANCE`, empty objects) | Silent failures - UI shows stale/empty data without user awareness |
| `audit.ts` | `try/catch` returns `[]` | Silent failure - no error indication |
| `leave.ts` | `try/catch` returns `[]` | Silent failure |
| `offices.ts` | `try/catch` returns `null`/`[]` | Silent failure |
| `organization.ts` | `try/catch` returns `null`/`{items:[],total:0}` | Silent failure; `getOrganizationSettings` throws in mock but not in real API |
| `security.ts` | `try/catch` returns `[]`/`zeros` | Silent failure |

**Critical Issue:** All **list/read queries** (`listAdminRoles`, `listLeavePolicies`, `listAuditLogs`, `getLocations`, `getShifts`, etc.) swallow errors and return empty data. Users see empty tables with no indication something failed.

---

### 3. Hook Layer Patterns (`src/modules/admin/hooks/*.ts`)

#### Mutation Hooks (Good Pattern)
```typescript
// useUserCreate, useUserDetail, useRoleForm - consistent
onError: (e: unknown) => {
  const msg = getApiErrorMessage(e, 'Could not save')
  setActionError(msg)
  setError('root', { type: 'server', message: msg })
}
```
- Uses `getApiErrorMessage` 
- Sets form-level `root` error for inline display
- Sets local `actionError` state for banner display

#### Query Hooks (Inconsistent)
| Hook | Error Handling |
|------|----------------|
| `useUsersList` | Returns `isError`, `isLoading` from `useQuery` - **page handles display** |
| `useRolesList` | Returns `isError` - **page does NOT handle display** (no ErrorState) |
| `useOrganizationSettings` | Returns raw `useQuery` - **no error handling in hook** |
| `useShiftsList` | Returns raw `useQuery` - **no error handling in hook** |
| `useRoleForm` | Returns `isLoadingCatalog`, `isLoadingRole` - **no error exposure** |

**Gap:** Query hooks don't expose parsed error messages. Pages must use `query.error` and call `getApiErrorMessage` themselves - but most don't.

---

### 4. Page/Component Display Patterns

#### Good: `UsersListPage.tsx` (lines 134-143)
```tsx
if (isError) {
  return (
    <ErrorState
      title="Could not load users"
      description="User list failed to load. Retry or go back."
      onRetry={() => void refetch()}
      onBack={() => safeNavigate(navigate, { to: myAdminRoutes.usersList })}
    />
  )
}
```

#### Good: `UserDetailPage.tsx` (lines 25-33, 46-57)
```tsx
if (d.isError || !d.display) {
  return <ErrorState title="Could not load user" description={d.loadError} onRetry={d.refetch} />
}

// Server error banner
{serverError && (
  <div className="...bg-error/10...">...</div>
)}
```
- Uses `loadError: getApiErrorMessage(detailQuery.error, ...)` in hook
- Shows inline banner for action errors

#### Missing: `RolesListPage.tsx` - **No error state handling**
- Uses `useRolesList` which returns `isError` but page never checks it
- Empty table renders silently on failure

#### Missing: Most settings pages (Attendance, Leave, Organization, Security)
- No error boundaries or error state checks
- Mutations have `onError: () => { /* Handled by consumer */ }` but consumers don't handle

---

## Detailed Findings by Feature Area

### Users Management
| Component | Status |
|-----------|--------|
| List page | ✅ Full ErrorState with retry |
| Create page | ✅ Inline field errors + root error banner |
| Detail page | ✅ Load error + action error banners + field errors |
| Hooks | ✅ `useUsersList` exposes `isError`; `useUserCreate`/`useUserDetail` handle mutations well |

### Roles Management
| Component | Status |
|-----------|--------|
| List page | ❌ No error handling (empty table on failure) |
| Create/Edit/Detail pages | ⚠️ Mutation errors handled, but **load errors not displayed** |
| Hooks | ⚠️ `useRolesList` exposes `isError` but pages ignore it |

### Attendance Settings
| Component | Status |
|-----------|--------|
| Pages | ❌ No error state handling for load or save |
| Hooks | ❌ `useUpdateOrganizationSettings` has empty `onError` |

### Leave Settings
| Component | Status |
|-----------|--------|
| Pages | ❌ No error handling |
| API | ❌ All queries return `[]` on error silently |

### Organization (Locations, Shifts, Positions, Holidays, Working Weeks)
| Component | Status |
|-----------|--------|
| All pages | ❌ No error state handling |
| Hooks | ❌ Mutations have empty `onError`; queries return raw `useQuery` |
| API | ❌ Silent failures returning `null`/`[]`/`{items:[],total:0}` |

### Audit Logs / Security Center
| Component | Status |
|-----------|--------|
| Pages | ❌ No error handling |
| API | ❌ `listAuditLogs` returns `[]` on error; `getSecurityKpis` returns zeros |

---

## Error Display Components Available

| Component | Location | Usage |
|-----------|----------|-------|
| `ErrorState` | `shared/components/feedback/ErrorState.tsx` | Full-page error with retry/back - **used in UsersList, UserDetail** |
| `PageLoadingSkeleton` | `shared/components/feedback/PageLoadingSkeleton.tsx` | Loading state - **used in UserDetail** |
| Toast/Notification | **MISSING** | No global toast system for mutation success/errors |
| Inline form errors | react-hook-form + `setError('root', ...)` | **Used in create/edit forms** |
| Banner alerts | Custom inline divs | **Used in UserDetail** |

---

## Backend Error Format Expectations

Based on `api-error.ts` parsing logic, backend should return:

```typescript
// Primary (AppException handler)
{ error: { code: string, message: string, details?: unknown } }

// FastAPI validation
{ detail: string | Array<{ msg: string, loc: unknown[], type: string }> }

// Legacy
{ message: string }
```

**HTTP Status Codes handled:**
- 401: "Session expired or invalid credentials"
- 403: "You do not have permission for this action"
- 404: "Resource not found"
- 409: "Conflict — this record already exists or cannot be changed"
- 422: "Please check the form and try again"
- 500+: "Server error. Please try again later."

---

## Recommendations

### Priority 1: Critical - Fix Silent Failures in List Queries

**API Layer:** Remove silent `catch { return [] }` patterns. Let errors propagate to React Query.

```typescript
// BAD - silent failure
export async function listAdminRoles(params?) {
  try {
    const { data } = await apiClient.get(...)
    return data
  } catch {
    return []  // User sees empty table, no indication of failure
  }
}

// GOOD - let React Query handle error state
export async function listAdminRoles(params?) {
  const { data } = await apiClient.get(...)
  return data  // Errors bubble to useQuery -> isError=true
}
```

**Exception:** Only swallow errors for truly optional/best-effort calls (e.g., `recordAuditEvent`).

### Priority 2: High - Standardize Query Hook Error Exposure

All query hooks should expose parsed error message:

```typescript
export function useRolesList() {
  const query = useQuery({ queryFn: listAdminRoles, ... })
  return {
    ...query,
    errorMessage: query.isError ? getApiErrorMessage(query.error) : null
  }
}
```

### Priority 3: High - Add ErrorState to All List Pages

Every list page (Roles, Locations, Shifts, Positions, Holidays, Working Weeks, Audit Logs, Leave Policies) needs:

```tsx
if (isError) {
  return <ErrorState title="Could not load [resource]" description={errorMessage} onRetry={refetch} />
}
```

### Priority 4: High - Implement Global Toast/Notification System

For mutation success/errors that don't need inline form display (e.g., lock/unlock, activate/deactivate, archive):

```typescript
// Need: useToast() hook or similar
toast.error(getApiErrorMessage(e, 'Action failed'))
toast.success('User activated')
```

### Priority 5: Medium - Standardize Mutation Hook Error Handling

Create a base mutation hook:

```typescript
function useAdminMutation(mutationFn, options) {
  return useMutation({
    mutationFn,
    onError: (e) => {
      const msg = getApiErrorMessage(e, options?.fallback)
      options?.onError?.(msg)
      // Optionally: toast.error(msg)
    },
    onSuccess: options?.onSuccess,
  })
}
```

### Priority 6: Medium - Add Error Boundaries

Wrap admin routes/pages with React Error Boundary for uncaught render errors.

### Priority 7: Low - Enhance `parseApiError` for Structured Handling

Add support for:
- `Retry-After` header parsing
- Structured error codes for programmatic handling (e.g., `AUTH_EXPIRED`, `VALIDATION_FAILED`)
- Field-level validation error mapping for forms

---

## Implementation Checklist

### Phase 1: Fix API Silent Failures
- [ ] `roles.ts` - `listAdminRoles`: remove try/catch
- [ ] `settings.ts` - `getAttendanceSettings`, `getLeaveAccrualPolicy`: remove try/catch
- [ ] `audit.ts` - `listAuditLogs`: remove try/catch
- [ ] `leave.ts` - `listLeavePolicies`, `listLeaveLedger`: remove try/catch
- [ ] `offices.ts` - `listOffices`, `getOffice`, `listHeadOfficeOptions`: remove try/catch
- [ ] `organization.ts` - All list/get functions: remove try/catch (except truly optional)
- [ ] `security.ts` - `listSecurityEvents`, `getSecurityKpis`: remove try/catch

### Phase 2: Update Hooks
- [ ] `useRolesList`: expose `errorMessage`
- [ ] `useOrganizationSettings`: expose `errorMessage`
- [ ] `useShiftsList`: expose `errorMessage`
- [ ] `useWorkingWeeks`, `useHolidayCalendars`, `useHolidays`, `usePositions`: expose `errorMessage`
- [ ] `useOrgLocationsForSelect`: expose `errorMessage`

### Phase 3: Update Pages
- [ ] `RolesListPage`: add ErrorState
- [ ] `RolesDetailPage`: add load error handling
- [ ] `AttendanceSettingsPage`: add load/save error handling
- [ ] `LeaveSettingsPage` / `LeavePoliciesPage` / `LeaveLedgerPage`: add error handling
- [ ] `LocationsListPage` / `LocationDetailPage`: add error handling
- [ ] `ShiftsListPage` / `ShiftDetailPage`: add error handling
- [ ] `PositionsListPage` / `PositionDetailPage`: add error handling
- [ ] `HolidaysListPage` / `HolidayCalendarsPage`: add error handling
- [ ] `WorkingWeeksPage`: add error handling
- [ ] `AuditLogsPage`: add error handling
- [ ] `SecurityCenterPage`: add error handling

### Phase 4: Infrastructure
- [ ] Add global toast/notification system
- [ ] Create `useAdminMutation` base hook
- [ ] Add Error Boundary for admin routes
- [ ] Document backend error contract

---

## Files to Modify (Priority Order)

1. **API files** (remove silent catches):
   - `src/modules/admin/api/roles.ts`
   - `src/modules/admin/api/settings.ts`
   - `src/modules/admin/api/audit.ts`
   - `src/modules/admin/api/leave.ts`
   - `src/modules/admin/api/offices.ts`
   - `src/modules/admin/api/organization.ts`
   - `src/modules/admin/api/security.ts`

2. **Hook files** (expose error messages):
   - `src/modules/admin/hooks/use-roles-list.ts`
   - `src/modules/admin/hooks/use-organization.ts`
   - `src/modules/admin/hooks/use-organization-shifts.ts`

3. **Page files** (add ErrorState):
   - `src/modules/admin/pages/RolesListPage.tsx`
   - `src/modules/admin/pages/RoleDetailPage.tsx`
   - `src/modules/admin/pages/AttendanceSettingsPage.tsx`
   - `src/modules/admin/pages/LeaveSettingsLayout.tsx` + children
   - `src/modules/admin/pages/organization/*.tsx` (all)
   - `src/modules/admin/pages/AuditLogsPage.tsx`
   - `src/modules/admin/pages/SecurityCenterPage.tsx`

4. **New infrastructure** (to create):
   - `src/shared/hooks/use-toast.ts` (or similar)
   - `src/shared/components/feedback/Toast.tsx`
   - `src/modules/admin/components/AdminErrorBoundary.tsx`