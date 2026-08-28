# Module Verification Report: Admin

## 1. Action Required Summary

### Pages Needing Refactoring

| File | Issues |
|------|--------|
| `pages/UsersListPage.tsx` | Inline status badge classes from enums (statusBadgeClass, statusDot), manual row press handlers, inline metric component |
| `pages/UserDetailPage.tsx` | **Hardcoded hex colors**: `bg-emerald-500`, `bg-red-500`, `bg-slate-400` in status badges; inline Modal/Field/Card components; hardcoded route `/admin/audit` in Quick Actions |
| `pages/UserCreatePage.tsx` | Inline route string `/workforce/employees/new`; Field/ReadOnly components defined inline |
| `pages/RolesListPage.tsx` | **Hardcoded hex colors**: `bg-green-100 text-green-700`, `bg-red-100 text-red-700`, `bg-slate-400`; inline RoleQuickContent/Metric components; `categoryStyles` from enums uses hardcoded classes |
| `pages/RoleDetailPage.tsx` | **Hardcoded query keys**: `['admin', 'roles']`, `['admin', 'users']`, `['admin', 'roles', roleId]`, `['admin', 'users', 'list']`; **hardcoded hex colors** in status badges (`bg-green-100 text-green-700`, `bg-red-100 text-red-700`); local compute logic for `assigned` users (fuzzy match by role name) |
| `pages/RoleFormPage.tsx` | Inline hierarchy/inherit options hardcoded as arrays; inline SelectField components; inline KpiCard component |
| `pages/LeaveSettingsPage.tsx` | **Manual useState** for `modalOpen`, `newType`, `accrual`; **hardcoded query keys**: `['admin', 'leave', 'types']`, `['admin', 'settings', 'leave-accrual']`; inline Modal component |
| `pages/AttendanceSettingsPage.tsx` | Uses React Hook Form + Zod correctly; some **hardcoded query keys** in invalidations |
| `pages/AuditLogsPage.tsx` | **Manual useState** for all filters (`search`, `actionFilter`, `moduleFilter`, `dateRange`, `timeRange`); **hardcoded query key** string array; inline KpiCard component |
| `pages/SecurityCenterPage.tsx` | **Hardcoded hex colors**: `rgb(0, 112, 234)` in conic-gradient, `bg-green-100 text-green-700`, `bg-blue-100 text-blue-600`, `bg-green-100 text-green-600`, `bg-amber-100 text-amber-600`, `bg-red-100 text-red-700`, `bg-amber-100 text-amber-800`; **hardcoded query keys** for security KPIs/events; inline UnavailableProtocol/ProtocolRow components |
| `pages/LeavePoliciesPage.tsx` | **Manual useState** for `showHistorical` |
| `pages/LeaveLedgerPage.tsx` | **Hardcoded query key**: `['admin', 'leave', 'ledger', employeeId ?? 'all']` |
| `pages/OrganizationSettingsPage.tsx` | **Manual useState** for `draft` form instead of React Hook Form; inline Field component |
| `pages/organization/LocationsListPage.tsx` | Inline route string `/admin/settings/offices/new`; uses `useListControls` but not integrated with queryKeys for filters |
| `pages/organization/ShiftDetailPage.tsx` | **Hardcoded query keys**: `['organization', 'shifts']`, `['organization', 'positions']`; inline route building with template strings; inline `field` component factory |
| `pages/settings/OrganizationProfileSection.tsx` | **Hardcoded query keys**: `['admin', 'settings', 'organization-profile']`; **manual useState** for `form` instead of React Hook Form |
| `pages/OfficeFormPage.tsx` | Uses React Hook Form + Zod correctly; **hardcoded query keys**: `['organization', 'locations']`, `['admin', 'offices']`; inline TextField component |
| `pages/settings/HeadOfficeSection.tsx` | **Hardcoded query key**: `['admin', 'offices', 'head-options']`; **manual useState** for `pickerOpen`, `headId`; inline Readonly component |
| `pages/settings/BrandingSection.tsx` | **Hardcoded hex colors**: `#000613`, `#0059bb` as defaultValue on color inputs |
| `pages/organization/ShiftsListPage.tsx` | **Type violation**: `type ShiftRow = any` with eslint-disable; inline route building with template strings |
| `pages/LeaveSettingsLayout.tsx` | **Manual useState** for `editing` |
| `pages/organization/HolidayCalendarsPage.tsx` | **Manual useState** for `creating`, `name` |
| `pages/organization/HolidaysListPage.tsx` | **Manual useState** for `adding`, `form`, `pickHolidayId` |
| `pages/organization/PositionDetailPage.tsx` | **Manual useState** for `name`; **hardcoded query keys** for positions |

### Hooks Needing Refactoring

| File | Issues |
|------|--------|
| `hooks/use-user-create.ts` | **Manual useState** for all form fields (`deptFilter`, `employmentId`, `email`, `tempPassword`, `roleId`, `sendInvite`, `error`) instead of React Hook Form + Zod; uses `queryKeys` correctly but local compute logic for email slug generation |
| `hooks/use-roles-list.ts` | Client-side filtering in `filtered` memo (should be server-side); **hardcoded filter options** (`STATUS_OPTIONS`, `CATEGORY_OPTIONS`) as const arrays |
| `hooks/use-user-detail.ts` | Uses React Hook Form for edit form correctly; **manual useState** for `status`, `avatarUrl`, `avatarUploading`, `resetOpen`, `lockOpen`, `resetSent`, `tempPassword` (modal/form state) |
| `hooks/use-role-form.ts` | **Manual useState** for all form fields (`name`, `description`, `hierarchy`, `inherit`, `active`, `matrix`, `seededFromDuplicate`) instead of React Hook Form + Zod; local compute logic for matrix operations |
| `hooks/use-organization-locations.ts` | Uses `queryKeys` correctly ✓ |
| `hooks/use-organization-shifts.ts` | Not fully reviewed but likely similar patterns |
| `hooks/use-organization.ts` | Uses `queryKeys` correctly ✓ |

---

## 2. Orphan Files Identified

| File | Status | Notes |
|------|--------|-------|
| `components/AttendanceSettingsNav.tsx` | **Orphan** | Defined but NOT used — `AttendanceSettingsLayout.tsx` does not import or render it |
| `components/LeaveSettingsNav.tsx` | Used | Imported and rendered in `LeaveSettingsLayout.tsx:70` |
| `components/AdminSettingsNav.tsx` | Used | Imported and rendered in `AdminSettingsLayout.tsx:52` |
| `pages/RoleFormPage.tsx` | Internal | Not exported from `index.ts` but used by `RoleCreatePage.tsx` and `RoleEditPage.tsx` — acceptable as internal component |
| `pages/settings/RegionalSection.tsx` | Used | Exported from `index.ts` and routed via `routes.tsx:105` |

---

## 3. Form & Type Violations

### Files Using Manual useState Instead of React Hook Form + Zod

| File | Violations |
|------|------------|
| `hooks/use-user-create.ts` | 7 `useState` calls for form fields (`deptFilter`, `employmentId`, `email`, `tempPassword`, `roleId`, `sendInvite`, `error`) — should use `useForm` with `userFormSchema` |
| `hooks/use-role-form.ts` | 7 `useState` calls for form fields (`name`, `description`, `hierarchy`, `inherit`, `active`, `matrix`, `seededFromDuplicate`) — should use `useForm` with a role form schema |
| `hooks/use-user-detail.ts` | 6 `useState` calls for modal/form state (`status`, `avatarUrl`, `avatarUploading`, `resetOpen`, `lockOpen`, `resetSent`, `tempPassword`) — partially uses RHF for edit form but modals use manual state |
| `pages/LeaveSettingsPage.tsx` | 3 `useState` calls (`modalOpen`, `newType`, `accrual`) |
| `pages/OrganizationSettingsPage.tsx` | 1 `useState` for `draft` form object |
| `pages/AuditLogsPage.tsx` | 5 `useState` calls for all filter state |
| `pages/SecurityCenterPage.tsx` | 2 `useState` calls (`score`, `sessionTimeout`) |
| `pages/LeavePoliciesPage.tsx` | 1 `useState` (`showHistorical`) |
| `pages/organization/ShiftDetailPage.tsx` | 1 `useState` for `draft` form object |
| `pages/settings/OrganizationProfileSection.tsx` | 1 `useState` for `form` object |
| `pages/settings/HeadOfficeSection.tsx` | 2 `useState` calls (`pickerOpen`, `headId`) |
| `pages/LeaveSettingsLayout.tsx` | 1 `useState` (`editing`) |
| `pages/organization/HolidayCalendarsPage.tsx` | 2 `useState` calls (`creating`, `name`) |
| `pages/organization/HolidaysListPage.tsx` | 3 `useState` calls (`adding`, `form`, `pickHolidayId`) |
| `pages/organization/PositionDetailPage.tsx` | 1 `useState` (`name`) |

### Instances of `any` Type

| File | Line | Context |
|------|------|---------|
| `routes.tsx` | 163 | `throw redirect({ to: '/admin/users' } as any)` |
| `routes.tsx` | 205 | `throw redirect({ to: '/admin/settings' } as any)` |
| `routes.tsx` | 236 | `throw redirect({ to: '/admin/leave-settings/policies' } as any)` |
| `routes.tsx` | 246 | `} as any)` |
| `routes.tsx` | 263 | `throw redirect({ to: '/notifications/settings' } as any)` |
| `pages/organization/ShiftsListPage.tsx` | 20-21 | `// eslint-disable-next-line @typescript-eslint/no-explicit-any` / `type ShiftRow = any` |

### Hardcoded Query Keys (String Arrays Instead of queryKeys Factory)

| File | Hardcoded Keys |
|------|----------------|
| `pages/RoleDetailPage.tsx` | `['admin', 'roles']`, `['admin', 'users']`, `['admin', 'roles', roleId]`, `['admin', 'users', 'list']` |
| `pages/LeaveSettingsPage.tsx` | `['admin', 'leave', 'types']`, `['admin', 'settings', 'leave-accrual']` |
| `pages/LeaveLedgerPage.tsx` | `['admin', 'leave', 'ledger', employeeId ?? 'all']` |
| `pages/OfficeFormPage.tsx` | `['organization', 'locations', numericId]`, `['organization', 'locations']`, `['admin', 'offices']` |
| `pages/settings/OrganizationProfileSection.tsx` | `['admin', 'settings', 'organization-profile']` |
| `pages/settings/HeadOfficeSection.tsx` | `['admin', 'offices', 'head-options']` |
| `pages/LeaveSettingsLayout.tsx` | `['admin', 'metrics', 'leave']` |
| `pages/AdminSettingsLayout.tsx` | `['admin', 'metrics', 'hub']` |
| `pages/organization/ShiftDetailPage.tsx` | `['organization', 'shifts']` |
| `pages/organization/PositionDetailPage.tsx` | `['organization', 'positions', id]`, `['organization', 'positions']` |
| `pages/organization/HolidayCalendarsPage.tsx` | `['organization', 'holiday-calendars']` |

### Hardcoded Hex Colors (Should Use CSS Variables)

| File | Colors |
|------|--------|
| `pages/UserDetailPage.tsx` | `bg-emerald-500`, `bg-red-500`, `bg-slate-400`, `bg-green-100 text-green-700`, `bg-red-100 text-red-700`, `bg-surface-container text-on-surface-variant` |
| `pages/RolesListPage.tsx` | `bg-green-100 text-green-700`, `bg-red-100 text-red-700`, `bg-slate-400`, `bg-emerald-500` |
| `pages/RoleDetailPage.tsx` | `bg-green-100 text-green-700`, `bg-red-100 text-red-700`, `bg-surface-container text-on-surface-variant`, `bg-emerald-500` |
| `pages/SecurityCenterPage.tsx` | `rgb(0, 112, 234)` in conic-gradient, `bg-green-100 text-green-700`, `bg-blue-100 text-blue-600`, `bg-green-100 text-green-600`, `bg-amber-100 text-amber-600`, `bg-red-100 text-red-700`, `bg-amber-100 text-amber-800` |
| `pages/settings/BrandingSection.tsx` | `#000613`, `#0059bb` as defaultValue |
| `pages/organization/LocationsListPage.tsx` | `bg-emerald-500`, `bg-slate-400` in statusDotClass |

### Direct navigate() Usage (Should Use safeNavigate)

**All pages correctly use `safeNavigate`** — no direct `navigate()` calls found. Good.