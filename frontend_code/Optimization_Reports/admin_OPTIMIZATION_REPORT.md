# Module Optimization Report: admin

**Updated:** 2026-09-02  
**Scope this pass:** Form & type violations, page refactoring that uses **existing** shared components/hooks only.  
**Constraint:** No new components. Remaining items deferred.

---

## Cleared this pass

| Item | Change |
|------|--------|
| LeaveSettingsPage accrual + add-type modal | → RHF+Zod with `leaveAccrualPolicySchema` / `leavePolicyFormSchema` |
| AuditLogsPage filter `useState` | → `useListControls` + `useListFilters` hook |
| SecurityCenterPage event status pills | → shared `securityEventBadge` utility from enums |
| OrganizationSettingsPage manual draft `useState` + local `Field` | → RHF+Zod with `organizationSettingsSchema` |
| use-roles-list client-side re-filter | → removed; API already handles server-side filters |

---

## Still deferred (do later)

### Pages

- **SecurityCenterPage** — session toggle local state (UI)
- **HeadOfficeSection** — picker UI state + local `Readonly` (no shared alternative)
- **RoleFormPage** — permission matrix local state (grid UI; not domain form)
- **UsersListPage / RolesListPage** — badge color utilities; long-press handlers (pattern OK)

### Hooks

- **use-role-form** — matrix `useState` remains (grid UI; not domain form)
- **use-user-detail** — modal flags remain UI state (no shared modal hook)

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
