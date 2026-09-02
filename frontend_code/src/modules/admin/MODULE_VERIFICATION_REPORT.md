# Module Verification Report: Admin

## 1. Action Required Summary

### Form & type + reusable components (this pass)

| Area | Status |
|------|--------|
| `hooks/use-user-create.ts` → RHF + `userFormSchema` | ✅ Done |
| `pages/UserCreatePage.tsx` → consumes hook RHF API (`register` / `watch` / `setValue` / `submit`) | ✅ Done |
| `hooks/use-role-form.ts` → RHF + `roleFormSchema` (matrix remains local UI state) | ✅ Done |
| `hooks/use-user-detail.ts` → RHF + `userEditFormSchema` for edit fields | ✅ Done |
| `pages/settings/OrganizationProfileSection.tsx` → RHF + `organizationProfileSchema` + shared `EditButton` | ✅ Done |
| `pages/settings/BrandingSection.tsx` → RHF + shared `Select` value/onChange binding | ✅ Done |
| `pages/UsersListPage.tsx` → shared `MetricCard` (removed inline Metric) | ✅ Done |
| `pages/RolesListPage.tsx` → shared `BulkSelectionBar` (removed custom selection chrome) | ✅ Done |
| `pages/RoleDetailPage.tsx` → `queryKeys.admin.*` | ✅ Done |
| `pages/LeaveSettingsPage.tsx` → `queryKeys.admin.leave/settings` | ✅ Done |
| `pages/organization/ShiftsListPage.tsx` → `ShiftRow` (no `any`) | ✅ Done |
| `routes.tsx` redirects → no `as any` | ✅ Done |
| `pages/AttendanceSettingsPage.tsx` → RHF + Zod + MetricCard | ✅ Already on main |
| `pages/OfficeFormPage.tsx` → RHF + Zod | ✅ Already on main |
| `pages/SecurityCenterPage.tsx` → MetricCard + `useSecurityScoreAnimation` | ✅ Already on main |

**Deferred (later pass — not in this form/type / reuse scope):**

- Accrual draft + add-type modal still use local `useState` on LeaveSettingsPage (UI/modal; no dedicated accrual form schema yet — do not invent schemas this pass).
- Modal / edit-flag UI state on user-detail, leave layout, holidays, head-office picker, etc. (not domain form state).
- Hardcoded Tailwind / CSS-var color utilities on status badges (User/Role/Security/Locations).
- Inline local subcomponents (Field/Modal/Readonly/Kpi helpers) still on several pages — extract only when product asks; **no new shared components this pass**.
- AuditLogsPage / SecurityCenter filter local state; client-side role list filter options.
- Fuzzy “assigned users” match on RoleDetailPage.
- Orphan `components/AttendanceSettingsNav.tsx` (unused).
- Duplicate `schemas/EntityForm.ts` vs `entity-form.ts` (confirm unused before delete).

### Pages still needing later polish (non-form)

| File | Deferred issues |
|------|-----------------|
| `pages/UsersListPage.tsx` | Inline status badge classes; press-handler pattern |
| `pages/UserDetailPage.tsx` | Status badge color utilities; inline Modal/Field |
| `pages/UserCreatePage.tsx` | Local ReadOnly helper (acceptable until shared Field) |
| `pages/RolesListPage.tsx` | Status/category badge color utilities |
| `pages/RoleDetailPage.tsx` | Status badge colors; assigned-users fuzzy match |
| `pages/RoleFormPage.tsx` | Permission matrix local state (grid UI) |
| `pages/LeaveSettingsPage.tsx` | Accrual/modal useState; inline modal markup |
| `pages/AuditLogsPage.tsx` | Filter useState; inline quick content |
| `pages/SecurityCenterPage.tsx` | Hardcoded colors on event status pills |
| `pages/organization/*` | Various local draft/picker state; badge colors |
| `pages/settings/HeadOfficeSection.tsx` | Picker UI state + local Readonly |
| `pages/settings/RegionalSection.tsx` | Static UI; native selects |
| `pages/OrganizationSettingsPage.tsx` | Manual draft useState + local Field |

### Hooks — deferred only

| File | Notes |
|------|-------|
| `hooks/use-roles-list.ts` | Client-side filter options / filtering (server-side later) |
| `hooks/use-user-detail.ts` | Modal open flags remain useState (UI) |
| `hooks/use-role-form.ts` | Permission matrix remains useState (grid UI) |

---

## 2. Orphan Files

| File | Status |
|------|--------|
| `components/AttendanceSettingsNav.tsx` | **Orphan** — not imported by AttendanceSettingsLayout |
| `components/LeaveSettingsNav.tsx` | Used |
| `components/AdminSettingsNav.tsx` | Used |
| `schemas/EntityForm.ts` | Likely duplicate of `entity-form.ts` — confirm before delete |
| `pages/RoleFormPage.tsx` | Internal to create/edit — OK |

---

## 3. Form & Type Violations (cleared for this pass)

Primary RHF + Zod form paths, UserCreate page/hook alignment, MetricCard/BulkSelectionBar/EditButton reuse, and Branding Select binding listed in the optimization report are **resolved** on main. Remaining useState is intentional UI state (modals, edit flags, permission matrix, filters) and is deferred.

---

## 4. Out of scope this pass (explicit)

- Hardcoded hex / Tailwind status colors → semantic tokens
- Extracting **new** shared components (`PermissionMatrix`, `EditableField`, `VirtualizedTableWithSelection`, `ConfigSection`, etc.)
- Server-side role list filters
- Full Audit/Security filter hook extraction
- Orphan file deletion (confirm product first)

---

*Updated 2026-09-02 — form/type + existing shared component reuse cleared; remainder deferred.*
