# Remaining Frontend Optimization

**Updated:** 2026-09-02  
**Source:** Consolidated from all module `*_OPTIMIZATION_REPORT.md`, `MODULE_VERIFICATION_REPORT.md`, and `docs/optimization-audit.md` (those files removed).  
**Constraint:** Prefer existing shared patterns; **new shared components only when explicitly requested**.

Cleared work (RHF+Zod on primary forms, safeNavigate + *Routes, semantic status tokens, list controls / server pagination on main lists, attendance API, Profile RHF, sales cache/dashboard-compute, etc.) is **not** listed here.

---

## 1. New shared components (cross-module — deferred by design)

Create under `src/shared/components/` only when product asks:

| Candidate | Suggested consumers |
|-----------|---------------------|
| `FormField` / `EditableField` | Admin org sections, UserCreate ReadOnly, Profile inline fields |
| `StatusBadge` | Projects `ProjectStatusBadge` / `TaskStatusBadge`; module enum maps |
| `PermissionMatrix` | `admin/pages/RoleFormPage.tsx` + `admin/hooks/use-role-form.ts` |
| `FilterToolbar` | Optional standardization beyond `ListToolbar` |
| `ConfigSection` | Admin settings / leave / attendance panels |
| `AuthCard`, `ServerErrorAlert`, `PasswordVisibilityToggle`, `AuthFormField` | `auth/pages/*` |
| `usePasswordVisibility` | Auth forms |
| Notification card / toggle extract | `notifications/pages/*` |
| StatCard / WeekBar / Calendar | `my-work` attendance & leave |

---

## 2. By module — remaining file-level work

### Admin

| File | Remaining |
|------|-----------|
| `pages/LeaveSettingsPage.tsx` | Accrual draft + add-type modal still local `useState` (UI/modal; no dedicated accrual form schema yet) |
| `pages/RoleFormPage.tsx` | Permission matrix local state (grid UI — intentional until shared component) |
| `hooks/use-role-form.ts` | Matrix `useState` remains |
| `hooks/use-user-detail.ts` | Modal open flags remain UI state |
| `hooks/use-roles-list.ts` | Client-side filter options → server-side later |
| `pages/UsersListPage.tsx` | Badge color utilities; long-press handlers (pattern OK) |
| `pages/RolesListPage.tsx` | Status/category badge utilities |
| `pages/UserDetailPage.tsx` | Status badge color utilities; inline Modal/Field helpers |
| `pages/RoleDetailPage.tsx` | Badge colors; fuzzy assigned-users match |
| `pages/AuditLogsPage.tsx` | Filter local state; inline quick content |
| `pages/SecurityCenterPage.tsx` | Event status pill colors; session toggle local UI state |
| `pages/settings/HeadOfficeSection.tsx` | Picker UI state + local Readonly |
| `pages/settings/RegionalSection.tsx` | Static UI / native selects |
| `pages/organization/OrganizationSettingsPage.tsx` | Manual draft `useState` + local Field (if still present) |
| `components/AttendanceSettingsNav.tsx` | **Orphan** — confirm unused then delete |
| `schemas/EntityForm.ts` | Likely duplicate of `entity-form.ts` — confirm then delete |

### Approvals

| File | Remaining |
|------|-----------|
| `pages/ApprovalCenterPage.tsx` | Filter Selects display-only; static pagination chrome |
| `hooks/use-approval-center.ts` | Wire filters/page to list controls + API; metrics from API when available |
| `pages/MyRequestsPage.tsx` | Real pagination later; product ownership vs my-work |
| `pages/ApprovalDetailPage.tsx` | Approve / reject / revision **mutations** (API) |

### Auth

| File | Remaining |
|------|-----------|
| `pages/LoginPage.tsx` (etc.) | Optional shared Auth* components (see §1) |
| `hooks/useLoginForm.ts` | Optional `useMutation` wrapper (AuthContext `login` is fine) |
| `hooks/useAuthBootstrap.ts` | Optional `useSyncExternalStore` polish |
| `context/AuthContext.tsx` | `can()` memo edge cases |

### My-work

| File | Remaining |
|------|-----------|
| `components/attendance/ManualAttendanceForm.tsx` | Full RHF (schemas exist) |
| `pages/TakeABreakPage.tsx` | Full RHF |
| `pages/AttendanceCorrectionsPage.tsx` | Correction modal RHF |
| `components/leave/LeaveCalendarTab.tsx` | Calendar consolidation / mock import cleanup |
| `pages/ApplyLeavePage.tsx` | Calendar extraction polish |
| `pages/MyAttendancePage.tsx` / `MyLeavePage.tsx` | Optional local StatCard → shared MetricCard |
| `data/mock.ts` | Thin re-export — delete when zero consumers |

### Notifications

| File | Remaining |
|------|-----------|
| `pages/NotificationSettingsPage.tsx` | Residual token sweep if any `deep-navy` left |
| Compose form | Optional dedicated page hook extract |
| — | New shared Notification* components (§1) |

### Payroll

| File | Remaining |
|------|-----------|
| `pages/PayrollReviewPage.tsx` | RecordPayment / review modal full RHF (`paymentRef` still local) |
| — | New shared components only if requested |

### Profile

| File | Remaining |
|------|-----------|
| — | ProfilePage RHF **done**; only new shared components if requested |

### Projects

| File | Remaining |
|------|-----------|
| API / product | Server-side budget totals when API exposes them |
| `components/CreateTaskModal.tsx` / `CreateTeamModal.tsx` | Keep unless product consolidates |
| `components/NotesPanel.tsx`, `data/notesMock.ts`, `data/documentsMock.ts` | Confirm orphans / move to fixtures |
| Status badges | Optional migrate to shared `StatusBadge` |

### Sales

| File | Remaining |
|------|-----------|
| `pages/CaseStudiesListPage.tsx` | Edit/Share buttons non-functional — wire routes or remove |
| Dedicated case-study create/edit route | Product |
| `components/LeadFiltersBar.tsx` | **Orphan** (list uses ListToolbar) — delete when confirmed |
| `data/mock.ts`, `data/mock-seed.ts` | Mock path only; optional `__mocks__` move |

### Workforce

| File | Remaining |
|------|-----------|
| `pages/EmployeeCreatePage.tsx` | Auth-step formal RHF schema (low value; 3-field optional step) |
| `pages/WorkforceRosterPage.tsx` | Status still synthesized from employments — needs roster API |
| — | New shared components only if requested |

### Dashboard

| File | Remaining |
|------|-----------|
| Dashboard pages | Optional MetricCard/KPI consolidation; no critical form debt |

---

## 3. Cross-cutting / product-API

- Server-driven pagination / virtualization at real-API scale (lists already patterned)
- Decision mutations (approvals detail)
- Dedicated roster endpoint (workforce)
- Case-study CRUD routes (sales)
- Confirm-and-delete orphans listed above

---

## 4. Explicitly out of scope until requested

- Building the full shared component library in §1 without a product ask
- Reworking intentional UI-only state (permission matrix, modals, edit flags, display-only filters)
- Backend contract changes beyond existing stubs

---

*Single source of remaining optimization work. Per-module optimization/verification reports removed 2026-09-02.*
