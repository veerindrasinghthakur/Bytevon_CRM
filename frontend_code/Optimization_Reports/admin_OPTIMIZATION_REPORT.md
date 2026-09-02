# Module Optimization Report: admin

**Updated:** 2026-09-02  
**Scope this pass:** Form & type violations, page refactoring that uses **existing** shared components/hooks only.  
**Constraint:** No new components. Remaining items deferred.

---

## Cleared this pass

| Item | Change |
|------|--------|
| UsersListPage inline `Metric` | → shared `MetricCard` |
| RolesListPage custom selection chrome | → shared `BulkSelectionBar` |
| UserCreatePage vs `useUserCreate` API mismatch | Page now uses RHF `register` / `watch` / `setValue` / `submit` from hook |
| OrganizationProfileSection raw edit control | → shared `EditButton` |
| BrandingSection Select bound via `{...register}` | → controlled `value` / `onChange` + `setValue` |
| AttendanceSettings / OfficeForm / Org profile / Role form identity / Security metrics | Already RHF+Zod or MetricCard on main (confirmed) |

---

## Still deferred (do later)

### Pages

- **LeaveSettingsPage** — accrual + add-type modal still `useState` (no new form schema this pass)
- **AuditLogsPage** — filter `useState`, inline quick content, virtualizer setup
- **SecurityCenterPage** — event status pill colors; session toggle local state (UI)
- **HeadOfficeSection** — picker UI state + local `Readonly`
- **RegionalSection** — static UI / native selects
- **OrganizationSettingsPage** — manual draft `useState` + local `Field`
- **RoleFormPage** — permission matrix local state (grid UI; not domain form)
- **UsersListPage / RolesListPage** — badge color utilities; long-press handlers (pattern OK)

### Hooks

- **use-roles-list** — client-side filter options (server-side later)
- **use-role-form** — matrix `useState` remains
- **use-user-detail** — modal flags remain UI state

### Orphans / cleanup (confirm before delete)

- `components/AttendanceSettingsNav.tsx`
- `schemas/EntityForm.ts` (duplicate casing of `entity-form.ts`)
- Docs-only: `ADMIN_API_PATTERN.md`, `ADMIN_API_CATALOG.md`

### Explicitly not doing this pass

- New shared components: `PermissionMatrix`, `EditableField` / `FormField`, `VirtualizedTableWithSelection`, `ConfigSection`, `KpiGrid`, `FilterToolbar`, `StatusIndicator`, etc.
- Badge / status color token migration
- Server-side roles list filters

---

*Cleared items removed from action lists. Implement deferred work in a later pass.*
