# dashboard — inventory & plan

Validation library: none in use (no `schema/` folder, no forms). No new library will be introduced; if a payload schema is ever needed, use **zod** (codebase standard).

## Inventory (12 files)

| File | Lines | Contains | Fails |
|---|---|---|---|
| `index.ts` | 3 | barrel (pages + routes) | naming/structure OK; must re-export new barrels |
| `routes.tsx` | 43 | route defs, lazy pages, path constants | OK (stays at root; not in target buckets but route files are conventionally root-level — logged in ambiguous.md) |
| `calendar.ts` | 44 | constants (CALENDAR_DAY_LABELS, WEEK_LABELS, ATTENDANCE_TREND_PERIODS) + `CalendarCell` type + `buildMonthGrid()` pure fn | **misplaced** (root; mixes lib + inline type) |
| `catalog.ts` | 245 | 5 named types (DashboardGate, DashboardQuickAction, DashboardKpiDef, DashboardSectionId, DashboardSectionDef) + constants (MAX_QUICK_ACTIONS, HOME_*) + `isGateAllowed()` | **misplaced** (root; mixes types + lib/data). Types must move to `types/` |
| `api/dashboard.ts` | 149 | `getExecutiveDashboard`, `getEmployeeDashboard`, `getDashboardAttendance` + 3 inline types (ExecutiveDashboardData, EmployeeDashboardData, DashboardAttendanceParams) | **inline types**; **naming** (must be `dashboard-api.ts`) |
| `data/mock.ts` | 167 | mock arrays for kpis/tasks/leave/activities/meta | OK as `data/` (not in target structure; leave, log as ambiguous — conventionally test-seed data) |
| `hooks/use-employee-dashboard.ts` | 48 | react-query + RBAC filter for employee quick actions | OK size; **naming OK** |
| `hooks/use-executive-dashboard.ts` | 23 | react-query wrapper | OK |
| `hooks/use-home-dashboard.ts` | 60 | derived RBAC-filtered quickActions/kpis/sections over executive query | OK size; imports types from `../catalog` (to be fixed) |
| `hooks/use-week-bars.tsx` | 82 | maps weekBars → JSX bar elements; duplicates BreakMarker/WeekBarData + 2 interfaces (UseWeekBarsOptions/Return) | **inline types** (4); **extension** `.tsx` kept deliberately (contains JSX) — logged |
| `pages/EmployeeDashboardPage.tsx` | 255 | data via hooks; 3 inline types (BreakMarker, WeekBarData, EmployeeMeta — identical duplicates of hook's); sections: hero, quick actions, KPI strip, attendance overview + leave summary, tasks table | **inline types**; **LARGE-PAGE** (>200, 5 sections) |
| `pages/ExecutiveDashboardPage.tsx` | 404 | data via useHomeDashboard + useMutation(decideApproval); sections: hero, quick actions, KPI strip, trends (attendance+pipeline), bottom row (pending approvals, activity feed, calendar) | **LARGE-PAGE** (6 sections); direct mutation call in page (should ideally live in `api/` but `decideApproval` belongs to approvals module — page keeps the `useMutation` wiring via a local hook extract) |

Missing checks: **no `types/` folder at all**; **no `schema/`** (none needed — no forms); **no `components/`**; **no per-folder barrels**; only module-root `index.ts` exists.

## Type extraction plan → `types/dashboard.types.ts`

- From `api/dashboard.ts`: `ExecutiveDashboardData`, `EmployeeDashboardData`, `DashboardAttendanceParams`.
- From `catalog.ts`: `DashboardGate`, `DashboardQuickAction`, `DashboardKpiDef`, `DashboardSectionId`, `DashboardSectionDef`.
- From `calendar.ts`: `CalendarCell`.
- From `pages/EmployeeDashboardPage.tsx` + `hooks/use-week-bars.tsx` (dedupe — identical `BreakMarker`/`WeekBarData` declared twice): single `BreakMarker`, `WeekBarData`, plus `EmployeeMeta`, `UseWeekBarsOptions`, `UseWeekBarsReturn`.
- Re-export mock-derived value types via `typeof` where already used (no change).

## Split plan (oversized files)

- `pages/ExecutiveDashboardPage.tsx` (404) → thin page + 5 components in `components/executive/`:
  `executive-hero.tsx`, `executive-quick-actions.tsx`, `executive-kpi-strip.tsx`, `executive-trends.tsx`, `executive-bottom-row.tsx` (pending approvals + activity + calendar stay together as one bottom-row grid component; further split only if any piece >150 lines). Page keeps: `useHomeDashboard`, calendar/today memos, attendance-days state, decide-mutation wiring (extracted to `hooks/use-executive-decision.ts` if >30 lines).
- `pages/EmployeeDashboardPage.tsx` (255) → thin page + 4 components in `components/employee/`:
  `employee-hero.tsx`, `employee-quick-actions.tsx`, `employee-kpi-strip.tsx`, `employee-attendance.tsx`, `employee-tasks-table.tsx` (5 small files; attendance+leave-summary stay one component).
- `catalog.ts` (245) → types to `types/`; remainder (constants + `isGateAllowed`) → `lib/dashboard-catalog.ts`.
- `calendar.ts` (44) → `CalendarCell` to `types/`; remainder → `lib/dashboard-calendar.ts`.
- `api/dashboard.ts` → `api/dashboard-api.ts` (rename only + type imports).
- `hooks/use-week-bars.tsx` keeps name/extension; strip types to imports.

## Rename / move plan (all via `git mv`)

- `api/dashboard.ts` → `api/dashboard-api.ts`
- `calendar.ts` → `lib/dashboard-calendar.ts`
- `catalog.ts` → `lib/dashboard-catalog.ts` (after type extraction)
- New: `types/dashboard.types.ts`, `types/index.ts`, `api/index.ts`, `hooks/index.ts`, `components/index.ts`, `pages/index.ts`, `lib/index.ts`, `schema/index.ts` (documents "no forms in this module").
- Components/pages keep PascalCase exports, kebab-case files.

## Import fixes (whole repo)

- `../catalog` imports (hooks/use-home-dashboard, tests dashboard-catalog) → `@/modules/dashboard/lib/dashboard-catalog` + `@/modules/dashboard/types`.
- `../calendar` imports (both pages, tests dashboard-calendar) → lib/types equivalents.
- `../api/dashboard` imports (hooks) → `../api/dashboard-api`.
- `../hooks/use-week-bars` unchanged path (same folder).
- `routes.tsx` lazy imports unchanged (pages stay in `pages/`).

## Verification

`npx tsc -b --pretty false`, `npx eslint src/modules/dashboard` (baseline has 2 pre-existing warnings in EmployeeDashboardPage: unused `cn`, `WEEK_LABELS` — must not add new ones), `npx vite build`, `vitest run tests/dashboard-* src/modules/dashboard`.
