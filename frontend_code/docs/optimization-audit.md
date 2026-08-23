# ByteVon Frontend — Optimization Audit

**Original audit:** 2026-08-22  
**Last updated:** 2026-08-23  
**Scope:** `frontend_code/` (GitHub `veerindrasinghthakur/bytevon_documentation`)  
**Status:** Implementation pass complete for high/medium items below.

---

## Summary

Shared building blocks (`useListSelection`, `BulkSelectionBar`, `PageLoadingSkeleton`, `ErrorState`, `Can`, `lazyPage`, compute helpers) are now adopted consistently across primary modules. List data loading is unified on **TanStack Query** with stable keys and invalidation. Lazy routes cover daily-use modules. Permission checks are memoized per employment session.

---

## Status by original item

### Code

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Mixed list-data loading | **Done** | Roles, depts, employees, teams on Query; sales/projects already were |
| 2 | Oversized page components | **Partial** | Leads: extracted `LeadMetricsRow` + `LeadFiltersBar`. MyLeave / MarkAttendance still large (optional) |
| 3 | Duplicate local `Icon` helpers | Open (Low) | Cosmetic; not blocking |
| 4 | Roles static mock in page | **Done** | `useRolesList` + `listAdminRoles` Query |
| 5 | Workforce teams static mocks | **Done** | Workforce list uses projects `getTeams` + shared query key |
| 6 | Selection incomplete | **Done** (primary lists) | Roles, Clients, Tasks, Projects Teams, Workforce Teams added; Leave/Attendance admin + Audit still optional |

### API / Data

| # | Item | Status | Notes |
|---|------|--------|-------|
| 7 | Mock delay | **Deferred** | Kept as-is by product request |
| 8 | Employees double-fetch | **Done** | Dual `useQuery`: employments + shared departments list key |
| 9 | Department detail imperative | **Done** | `useDepartmentDetail` + invalidate list/staff/employees |
| 10 | Sales leads metrics contract | Open (Low) | Fine for mock |
| 11 | `can()` walks seed tables | **Done** | Memoized effective grants per employmentId; cleared on session change |

### Performance

| # | Item | Status | Notes |
|---|------|--------|-------|
| 12 | Virtualization | Open (Low) | Not needed at current seed sizes |
| 13 | Leads loading gate | **Done** | TableSkeleton + ErrorState (was already present; verified) |
| 14 | Lazy loading incomplete | **Done** | dashboard, approvals, notifications, my-work, workforce all use `lazyPage` |
| 15 | Shared filter util | Open (Low) | Optional |

### UI / UX

| # | Item | Status | Notes |
|---|------|--------|-------|
| 16 | Loading/error inconsistency | **Mostly done** | Primary lists use TableSkeleton / ErrorState |
| 17 | Native `<select>` on Roles | **Done** | Shared `Select` on Roles filters |
| 18 | Selection discoverability | Open (Low) | Hint text on tables; product decision for toolbar toggle |
| 19 | a11y icon-only actions | Open (Medium) | Spot-check remaining pages |
| 20 | Dark mode tokens | Open (Medium) | Prefer semantic tokens over `bg-emerald-50` etc. |

---

## Selection mode status (updated)

| List | Selection | Bulk bar | Export selected |
|------|-----------|----------|-----------------|
| Projects | Yes | Yes | Yes |
| Leads | Yes | Yes | Yes |
| Users | Yes | Yes | Yes |
| Employees | Yes | Yes | Yes |
| Departments | Yes | Yes | Yes |
| Roles | Yes (cards) | Yes | Yes |
| Clients | Yes | Yes | Yes |
| Tasks | Yes | Yes | Yes |
| Projects Teams | Yes | Yes | Yes |
| Workforce Teams | Yes | Yes | Yes |
| Leave / Attendance admin tables | No | — | — |
| Audit logs | No | — | — |

---

## Key query keys (reference)

| Domain | Key pattern |
|--------|-------------|
| Roles list | `['admin', 'roles', 'list']` |
| Role metrics | `['admin', 'metrics', 'roles']` |
| Departments list | `['workforce', 'departments', 'list', …]` |
| Department detail / staff | `['workforce', 'departments', 'detail', id]` / `…, 'staff', id]` |
| Employees list | `['workforce', 'employees', 'list']` |
| Projects teams | `['projects', 'teams', 'list', filters]` |

Department mutations invalidate detail, staff, departments list, and employees list.

---

## Commits applied (2026-08-23 implementation pass)

- Roles: `useRolesList` + page on Query / Select / selection  
- Workforce teams: shared projects teams API + selection + loading gates  
- Projects teams: selection + ErrorState  
- Lazy routes: dashboard, approvals, notifications, my-work, workforce  
- RBAC: permission grant memoization  
- Departments: list Query; detail Query + mutation invalidation  
- Employees: dual Query with shared department keys  
- Leads: extract `LeadMetricsRow`, `LeadFiltersBar`  

---

## Remaining (optional / low priority)

1. Extract subcomponents from `MyLeavePage` / `MarkAttendancePage` if those files keep growing.  
2. Shared `MaterialIcon` helper (cosmetic).  
3. Selection on Audit + Leave/Attendance admin tables if product wants bulk export there.  
4. a11y pass + dark-mode token cleanup.  
5. Virtualization only if list sizes grow past ~100–150 rows.  
6. Configurable mock delay (explicitly deferred).

---

*End of updated audit.*
