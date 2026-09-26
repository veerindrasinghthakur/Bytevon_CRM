# workforce — inventory & plan (~60 files)

Validation library: **zod** (10 schema files). Stay with zod.

## Inventory summary

- Root: `index.ts` 63, `routes.tsx` 317, `types.ts` 289 (God-types at root — misplaced; no `types/` folder).
- `api/`: `employment.ts` **838**, `departments.ts` 528, `attendance.ts` 258 (inline `AttendanceDayRow`, `PendingCorrection`), `workforce.ts` 104, `shift.ts` 120, `person.ts` 93 (inline `Person`, `PersonUpdateInput`), `bank.ts` 34. Inline: `EmploymentListItem` (ReturnType alias), `RehireEmploymentBody`. Rename → `*-api.ts`.
- `components/`: `employee/EmployeeTable` **298 LARGE-COMP** (inline `EmployeeListRow`, `SelectionApi`, `Props`); 14 small employee files each with inline `Props` (Address, Bank, TabNav, Edit, Filters, History, Overview, Sidebar, QuickContent, QuickLinks, Salary, Stats); `employee-create-utils.tsx`/`employee-detail-utils.tsx` (utils in components → `lib/`); `RouteCrumbs.tsx` 104 at components root (kebab violation → `route-crumbs.tsx`).
- `hooks/`: LARGE-HOOK: `department/use-departments.ts` 189, `use-employees-list.ts` 121 (inline `FilterKey`); rest small (40–96).
- `pages/`: LARGE-PAGES: `AttendanceDashboardPage` **677** (!), `DepartmentDetailPage` 675 (!), `DepartmentsListPage` 407, `EmployeeBankDetailsPage` 382, `shift/ShiftDetailPage` 371, `AddMemberPage` 298, `employee/EmployeeCreatePage` 573 (!), `employee/EmployeeDetailPage` 395, `shift/ShiftsListPage` 211, `DepartmentCreatePage` 209, `position/PositionDetailPage` 203; small: AttendanceDayDetail 84, AttendanceEmployees 143, ChangeAssignment 197, EmployeesList 184, PositionsList 108, Roster 117, WorkforceAttendanceDetail 105; 3 two-line stubs (`EmployeeCreatePage`, `EmployeeDetailPage`, `EmployeesListPage`) shadowing `pages/employee/*`.
- `schemas/` (10 files, plural → `schema/` + `.schema.ts`); `z.infer` stays; hand `DepartmentListItem`, `DepartmentEmployee` aliases re-export via types.
- Baseline: git working tree already has local modifications in `AttendanceDashboardPage.tsx` + `AttendanceEmployeesPage.tsx` (uncommitted) — stash/confirm before `git mv`, log.

## Type extraction plan → `types/*.types.ts` (new folder)

- `types/employment.types.ts`: EmploymentListItem, RehireEmploymentBody + employment slice of root types.ts.
- `types/attendance.types.ts`: AttendanceDayRow, PendingCorrection + slice.
- `types/person.types.ts`: Person, PersonUpdateInput.
- `types/employee.types.ts`: EmployeeListRow, SelectionApi, FilterKey, ShiftStaffRow (ShiftDetailPage:27), EmployeeDetailTab (employee-detail-utils), all employee `Props` → `*Props`.
- `types/route.types.ts`: Crumb/CrumbsFromPathOptions/RouteCrumbsProps/DynamicRouteCrumbsProps (currently in root types.ts but belong to RouteCrumbs component).

## Split plan (largest first)

- `AttendanceDashboardPage` 677 → page + `components/attendance/attendance-kpis.tsx`, `attendance-week-chart.tsx`, `attendance-recent-table.tsx` + `hooks/attendance/use-attendance-dashboard.ts`.
- `DepartmentDetailPage` 675 → page + `components/department/department-header.tsx`, `department-members.tsx`, `department-metrics.tsx`.
- `EmployeeCreatePage` 573 → page + `components/employee/employee-create-form.tsx`, `employee-create-bank.tsx`, `employee-create-docs.tsx` (reuse existing small forms).
- `DepartmentsListPage` 407, `EmployeeDetailPage` 395, `EmployeeBankDetailsPage` 382, `ShiftDetailPage` 371 → same thin-page + table/form/section pattern.
- `employment.ts` 838 → `employment-api.ts` + `employment-mutations-api.ts` + `rehire-api.ts`; `departments.ts` 528 → `departments-api.ts` + `department-members-api.ts`.
- `EmployeeTable` 298 → table + `employee-table-row.tsx` + `employee-table-toolbar.tsx`.
- `use-departments` 189 → query + mutation slices.

## Rename / move plan (via `git mv`)

- `RouteCrumbs.tsx` → `route-crumbs.tsx`; `employee-*-utils.tsx` → `lib/`; stub pages deleted after check; `schemas/` → `schema/*.schema.ts`; `api/` → `*-api.ts`.
- New `types/` + barrels everywhere.

## Import fixes (whole repo)

- Root `types` importers (many workforce pages) → `types/*`; RouteCrumbs paths; stub-page paths (routes.tsx); tests/workforce-*.test.ts.

## Verification

`npx tsc -b`, `npx eslint src/modules/workforce`, `npx vite build`, `vitest run tests/workforce-* src/modules/workforce`.
