# ByteVon Frontend — Optimization Audit

**Original audit:** 2026-08-22  
**Last updated:** 2026-08-23  
**Scope:** `frontend_code/` (GitHub `veerindrasinghthakur/bytevon_documentation`)  
**Status:** Implementation pass complete for high/medium items + shared list controls.

---

## Summary

Shared building blocks now include:

| Concern | Shared API |
|---------|------------|
| Selection | `useListSelection` + `BulkSelectionBar` |
| Search | `useListSearch` |
| Filters | `useListFilters` |
| Pagination | `useListPagination` + `Pagination` UI + `paginate()` |
| Compose all three | **`useListControls`** |
| Toolbar UI | `ListToolbar` |
| Loading / error | `PageLoadingSkeleton`, `TableSkeleton`, `ErrorState` |
| Data | TanStack Query + stable keys |
| Code split | `lazyPage` |
| Permissions | memoized `can()` |

List hooks should prefer `useListControls` so search/filter/page state and “reset page on filter change” stay consistent.

---

## Status by original item

### Code

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Mixed list-data loading | **Done** | Roles, depts, employees, teams on Query |
| 2 | Oversized page components | **Partial** | Leads: `LeadMetricsRow` + `LeadFiltersBar` |
| 3 | Duplicate local `Icon` helpers | Open (Low) | Cosmetic |
| 4 | Roles static mock in page | **Done** | `useRolesList` |
| 5 | Workforce teams static mocks | **Done** | Projects teams API + shared key |
| 6 | Selection incomplete | **Done** (primary lists) | Leave/Attendance admin + Audit optional |
| **21** | **Search / filter / pagination duplication** | **Done** | See “Shared list controls” below |

### API / Data

| # | Item | Status |
|---|------|--------|
| 7 | Mock delay | **Deferred** (product) |
| 8 | Employees double-fetch | **Done** |
| 9 | Department detail imperative | **Done** |
| 10 | Sales metrics contract | Open (Low) |
| 11 | `can()` seed walks | **Done** |

### Performance / UI

| # | Item | Status |
|---|------|--------|
| 12 | Virtualization | Open (Low) |
| 13 | Leads loading gate | **Done** |
| 14 | Lazy loading | **Done** |
| 15 | Shared filter util | **Superseded** by `useListFilters` / `useListControls` |
| 16 | Loading/error consistency | **Mostly done** |
| 17 | Native select on Roles | **Done** |
| 18–20 | Discoverability / a11y / dark tokens | Open (Low–Medium) |

---

## Shared list controls (2026-08-23)

### Hooks (`shared/hooks/`)

| Hook | Role |
|------|------|
| `useListSearch` | Search string + clear + `hasSearch` |
| `useListFilters` | Named filter map, `setFilter`, `resetFilters`, `filtersActive` |
| `useListPagination` | `page` / `setPage` / `pageSize` / `pageItems()` / `range()`; `resetPage` |
| `useListControls` | Composes the three; **resets page when search or any filter changes** |

### UI (already present)

| Component | Role |
|-----------|------|
| `ListToolbar` | Search input + filter/actions slots + reset/refresh |
| `Pagination` | Page chips + “Showing a–b of n”; only when `total > pageSize` |
| `paginate()` | Client slice helper |

### Adopted in list hooks (same page APIs preserved)

| Hook | Module |
|------|--------|
| `useRolesList` | admin |
| `useProjectsList` | projects |
| `useLeadsList` | sales |
| `useClientsList` | sales |
| `useEmployeesList` | workforce |

Pages keep existing filter UI (Selects, LeadFiltersBar, etc.). Logic for search/filters/page now flows through shared hooks. Remaining list hooks (tasks, teams, departments, users, audit) can switch the same way without UI changes.

### Pattern for new / remaining lists

```ts
const controls = useListControls({
  filterDefaults: { status: 'All', type: 'All' },
})
// controls.search / setSearch
// controls.filters.status / setFilter('status', v)
// controls.page / setPage / pageItems(filtered)
// controls.resetAll / anyActive
```

Toolbar:

```tsx
<ListToolbar
  search={controls.search}
  onSearchChange={controls.setSearch}
  filtersActive={controls.anyActive}
  onResetFilters={controls.resetAll}
  filterSlot={/* Select(s) */}
/>
<Pagination
  page={controls.page}
  pageSize={controls.pageSize}
  total={filtered.length}
  onPageChange={controls.setPage}
/>
```

---

## Selection mode status

| List | Selection | Bulk bar | Export selected |
|------|-----------|----------|-----------------|
| Projects | Yes | Yes | Yes |
| Leads | Yes | Yes | Yes |
| Users | Yes | Yes | Yes |
| Employees | Yes | Yes | Yes |
| Departments | Yes | Yes | Yes |
| Roles | Yes | Yes | Yes |
| Clients | Yes | Yes | Yes |
| Tasks | Yes | Yes | Yes |
| Projects / Workforce Teams | Yes | Yes | Yes |
| Leave / Attendance admin | No | — | — |
| Audit logs | No | — | — |

---

## Key query keys

| Domain | Key |
|--------|-----|
| Roles | `['admin','roles','list']` |
| Departments | `['workforce','departments','list',…]` |
| Employees | `['workforce','employees','list']` |
| Projects teams | `['projects','teams','list',…]` |

---

## Remaining (optional)

1. Migrate remaining list hooks (tasks, teams, departments, users, audit) to `useListControls`.  
2. Mount `Pagination` on lists that only show “1–n of n” text today.  
3. Extract subcomponents from MyLeave / MarkAttendance if needed.  
4. Shared `MaterialIcon`; a11y + dark-token pass.  
5. Mock delay config (deferred).

---

*End of updated audit.*
