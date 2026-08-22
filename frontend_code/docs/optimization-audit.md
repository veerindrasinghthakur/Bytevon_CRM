# ByteVon Frontend — Optimization Audit

**Date:** 2026-08-22  
**Scope:** `frontend_code/` (GitHub `veerindrasinghthakur/bytevon_documentation`)  
**Status:** Audit only — no optimizations applied in this pass.

---

## Summary

The app has solid shared building blocks (`useListSelection`, `BulkSelectionBar`, `PageLoadingSkeleton`, `ErrorState`, `Can`, `lazyPage`, compute helpers). Gaps are mainly **inconsistent adoption**, **mixed data-fetch styles** (raw `useEffect` vs TanStack Query), and **oversized page components**. Priority should be consistency and query unification before micro-performance work.

---

## Code

### 1. Mixed list-data loading patterns
- **File/component:** `admin/pages/UsersListPage.tsx`, `workforce/hooks/use-departments-list.ts`, `workforce/hooks/use-employees-list.ts` vs `projects/hooks/use-projects.ts`, `sales/hooks/use-sales.ts`
- **Problem:** Some lists use imperative `useEffect` + local state; others use TanStack Query.
- **Why it matters:** Duplicate loading/error handling, harder caching, inconsistent retry/refetch UX.
- **Recommended improvement:** Migrate remaining list hooks to `useQuery` with stable `queryKey`s; keep page components thin.
- **Priority:** High  
- **Risk:** Medium

### 2. Oversized page components
- **File/component:** `sales/pages/LeadsListPage.tsx` (~700+ lines), `my-work/pages/MyLeavePage.tsx`, `my-work/pages/MarkAttendancePage.tsx`, `admin/pages/RolesListPage.tsx`
- **Problem:** UI, filters, selection, and presentation logic live in one file.
- **Why it matters:** Harder maintenance, larger re-render surface, slower reviews.
- **Recommended improvement:** Extract row/card subcomponents and filter bars; keep data in hooks (already partly done for leads).
- **Priority:** Medium  
- **Risk:** Low

### 3. Duplicate local `Icon` helpers
- **File/component:** Many pages define `function Icon({ name })` inline
- **Problem:** Repeated identical helper across modules.
- **Why it matters:** Noise and slight bundle duplication; not a runtime issue.
- **Recommended improvement:** Single shared `MaterialIcon` in `shared/components/ui` if desired.
- **Priority:** Low  
- **Risk:** Low

### 4. Roles list uses static mock array in the page
- **File/component:** `admin/pages/RolesListPage.tsx` + `admin/data/mock.ts`
- **Problem:** Filters over `adminRoles` directly; metrics via query but list not.
- **Why it matters:** Split source of truth; selection/export won’t match real API later.
- **Recommended improvement:** `listRoles` API + `useQuery`; page consumes hook only.
- **Priority:** High  
- **Risk:** Medium

### 5. Workforce teams still on static mocks
- **File/component:** `workforce/pages/TeamDetailPage.tsx`, `TeamMembersPage.tsx`, `TeamProjectsPage.tsx`, `data/mock.ts`, `data/teamExtraMock.ts`
- **Problem:** Parallel team models vs projects module API teams.
- **Why it matters:** Drift between workforce and projects team UIs; broken deep links risk.
- **Recommended improvement:** Point workforce team pages at projects teams API or a single shared teams module.
- **Priority:** High  
- **Risk:** Medium

### 6. Selection not yet on every list
- **File/component:** Clients list, Tasks list, Teams list, Roles (card grid), Attendance/Leave admin tables, Audit logs
- **Problem:** Pattern exists (`useListSelection`) but adoption incomplete.
- **Why it matters:** Inconsistent bulk export UX.
- **Recommended improvement:** Apply same long-press + checkbox + `BulkSelectionBar` + `ExportButton selectedIds` pattern (Projects/Leads/Users/Employees/Departments as reference).
- **Priority:** Medium  
- **Risk:** Low

---

## API / Data

### 7. Mock delay on every call
- **File/component:** `shared/mock/db.ts` `delay()`, all API modules
- **Problem:** Artificial latency everywhere; fine for UX demo, not for stress testing.
- **Why it matters:** Masks real performance; slows iterative QA.
- **Recommended improvement:** Configurable delay (env flag) default lower in dev.
- **Priority:** Low  
- **Risk:** Low

### 8. Employees list double-fetch on mount
- **File/component:** `use-employees-list.ts` → `listEmployments` + `listDepartments`
- **Problem:** Two sequential-ish network (mock) calls without shared query cache.
- **Why it matters:** With real API, extra latency; departments re-fetched per page visit.
- **Recommended improvement:** `useQuery` for employments and departments with shared keys used by other pages.
- **Priority:** Medium  
- **Risk:** Low

### 9. Department detail imperative reload
- **File/component:** `DepartmentDetailPage.tsx`
- **Problem:** Local state + manual `reload()`; no query invalidation pattern.
- **Why it matters:** After mutations, other lists stay stale until remount.
- **Recommended improvement:** Query keys + `invalidateQueries` after assign/remove/update.
- **Priority:** Medium  
- **Risk:** Medium

### 10. Sales leads metrics baked into list response
- **File/component:** `sales` API/hooks
- **Problem:** Metrics depend on full filtered set returned with list.
- **Why it matters:** Fine for mock; real backends often separate aggregate endpoints.
- **Recommended improvement:** Document contract; if backend splits aggregates, add dedicated metrics query.
- **Priority:** Low  
- **Risk:** Low

### 11. `can()` reads full mock DB synchronously
- **File/component:** `shared/rbac/can.ts`
- **Problem:** Every permission check walks seed tables; Super Admin short-circuit helps.
- **Why it matters:** With large permission matrices, UI thrash if called in tight render loops.
- **Recommended improvement:** Memoize effective permissions per employment once per session.
- **Priority:** Medium  
- **Risk:** Medium

---

## Performance

### 12. Long-press timer on every row without virtualization
- **File/component:** Lists using `useListSelection`
- **Problem:** Fine for tens of rows; hundreds+ will feel heavy.
- **Why it matters:** DOM size + event handlers scale linearly.
- **Recommended improvement:** Virtualize only when lists exceed ~100–150 rows; not urgent for current seed sizes.
- **Priority:** Low  
- **Risk:** Medium

### 13. Projects list already good; Leads missing loading gate
- **File/component:** `LeadsListPage.tsx` vs `useLeadsList` (`isLoading`/`isError` available)
- **Problem:** Hook exposes loading/error; page still renders empty table shell without skeleton/ErrorState.
- **Why it matters:** Flash of empty content; inconsistent with Projects/Users.
- **Recommended improvement:** Early return `PageLoadingSkeleton` / `ErrorState` like other lists.
- **Priority:** High  
- **Risk:** Low

### 14. Lazy loading coverage incomplete
- **File/component:** `dashboard/routes.tsx`, `my-work/routes.tsx`, `approvals/routes.tsx`, `notifications/routes.tsx`, `workforce/routes.tsx` still eager
- **Problem:** Admin/payroll/sales/projects lazy; daily-use modules still in main chunk.
- **Why it matters:** Initial bundle larger than necessary for admin-only visits; converse for employee-first users.
- **Recommended improvement:** Lazy heavy my-work/attendance pages; keep shell + login eager.
- **Priority:** Medium  
- **Risk:** Low

### 15. Repeated `useMemo` filters without shared search util
- **File/component:** Multiple list hooks
- **Problem:** Similar filter predicates copied.
- **Why it matters:** Maintainability more than CPU.
- **Recommended improvement:** Optional tiny `filterByQuery(items, fields, q)` helper — only if duplication grows.
- **Priority:** Low  
- **Risk:** Low

---

## UI / UX consistency

### 16. Loading/error inconsistency
- **File/component:** Mix of “Loading…” text, custom pulse rows, `PageLoadingSkeleton`, `TableSkeleton`
- **Problem:** Visual inconsistency across modules.
- **Why it matters:** Perceived quality; harder a11y labeling.
- **Recommended improvement:** Standardize: full-page → `PageLoadingSkeleton`; table body → `TableSkeleton`; errors → `ErrorState`.
- **Priority:** High  
- **Risk:** Low

### 17. Native `<select>` remains on some admin forms
- **File/component:** `RolesListPage` filters, some settings forms
- **Problem:** Employee create was migrated to shared `Select`; roles filters still native.
- **Why it matters:** Design system inconsistency.
- **Recommended improvement:** Shared `Select` for filter bars.
- **Priority:** Medium  
- **Risk:** Low

### 18. Selection discoverability
- **File/component:** Lists with long-press only
- **Problem:** Hint text present on some tables; not all users discover 3s hold.
- **Why it matters:** Bulk export underused.
- **Recommended improvement:** Optional toolbar “Select” toggle later — product decision; do not invent bulk actions.
- **Priority:** Low  
- **Risk:** Low

### 19. Accessibility: icon-only row actions
- **File/component:** Many list action columns
- **Problem:** Mostly have `aria-label`; verify gaps on older pages.
- **Why it matters:** Screen reader gaps.
- **Recommended improvement:** Audit pass for buttons without accessible names.
- **Priority:** Medium  
- **Risk:** Low

### 20. Dark mode tokens
- **File/component:** Hardcoded color classes e.g. `bg-emerald-50`, `bg-red-50` in badges
- **Problem:** Light-theme-centric utility colors may clash in dark mode.
- **Why it matters:** Contrast issues when theme toggles.
- **Recommended improvement:** Prefer semantic tokens (`bg-secondary/10`, status tokens) where available.
- **Priority:** Medium  
- **Risk:** Low

---

## Selection mode status (this pass)

| List | Selection | Bulk bar | Export selected |
|------|-----------|----------|-----------------|
| Projects | Yes | Yes | Yes |
| Leads | Yes | Yes | Yes |
| Users | Yes (this pass) | Yes | Yes |
| Employees | Yes (this pass) | Yes | Yes |
| Departments | Yes (this pass) | Yes | Yes |
| Roles | No (card UI) | — | — |
| Clients | No | — | — |
| Tasks / Teams | No | — | — |
| Leave / Attendance tables | No | — | — |
| Audit logs | No | — | — |

---

## Suggested implementation order (later task)

1. **High / Low risk:** Leads loading/error gate; standardize skeletons/ErrorState.  
2. **High / Medium risk:** Roles + workforce teams → real API/query hooks.  
3. **Medium:** Remaining lists → `useListSelection`; my-work/admin lazy routes.  
4. **Medium:** Permission matrix memoization; query invalidation on department mutations.  
5. **Low:** Icon helper consolidation; virtualization only if list sizes grow.

---

*End of audit. No code changes beyond selection adoption and this document were made for optimization itself.*
