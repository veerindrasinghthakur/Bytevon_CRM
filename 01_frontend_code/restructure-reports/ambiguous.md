## approvals (executed)

- `enums.ts` (root, consts + 2 derived types) → runtime consts to `lib/approval-enums.ts`, canonical `ApprovalStatus`/`ApprovalPriority` literals to `types/approval.types.ts`. Reason: const arrays and type aliases shared a name, so they could not move together without a merged-declaration clash; literals pin the backend contract. The lib file imports the types under aliases (`ApprovalPriorityType`) for its `Record<>` maps.
- `ApprovalStatus`/`ApprovalPriority` exist as BOTH a type (types/) and a const array (lib/) with the same name. `lib/index.ts` therefore lists value exports explicitly instead of `export *`, and the module barrel exposes the consts as `ApprovalStatusEnum`/`ApprovalPriorityEnum` (pre-existing public names, preserved).
- `types/request.types.ts` no longer re-exports `ApprovalStatus`/`ApprovalPriority` (that caused `export *` ambiguity in the barrel). Internal type-only importers updated to `types/approval.types.ts`; no external importer used that path (verified by grep).
- 3 two-line stub hooks at `hooks/` shadowing real `hooks/<domain>/*` files → stubs `git rm`'d, real files `git mv`'d onto the same paths. Git shows delete+modify rather than rename for these, but blob similarity preserves reviewability; logged here.
- `api/approvals.ts` compat barrel (pure re-exports) folded into `api/index.ts`, file `git rm`'d. Reason: barrel duplication; `api/index.ts` is the single barrel now.
- Root `types.ts` stub deleted; the one external importer (`my-work/api/my-work.ts` → `ApprovalRow`) repointed to `types/request.types`. Reason: root stub added a second home for types.
- `data/mock.ts` dropped its `export type {...}` re-export lines (dead public surface; verified zero importers). Values untouched.
- `ApprovalCenterTable` takes a `header` ReactNode prop for the filter row so the filters+table+pagination stay one `bv-surface` card — DOM identical to before, just split across files.
- `ApprovalDetailPage` split into title (full-width, above grid) vs overview (left column) components to preserve the original 8/4 grid layout exactly.
- `MyRequestsPage` (174 lines) intentionally NOT split — under the 200-line guideline with a single table concern.
- `FALLBACK_ROW` const stays in `ApprovalDetailPage` (page-local fallback data, not a named type).
- Cross-module `decideApproval` import in dashboard (`use-executive-decision.ts`) repointed to `api/approval-action-api`; logic untouched.
- ApprovalDetail decision form + mutation moved to `hooks/use-approval-decision.ts` (page rule: no direct data fetching in pages).

## dashboard (executed)

- `catalog.ts` (root, types + constants + fn) → split into `types/dashboard.types.ts` (5 types) + `lib/dashboard-catalog.ts` (constants + `isGateAllowed`). Reason: types must live in `types/`; remainder is pure RBAC-gating logic + static catalogs = lib.
- `calendar.ts` (root, consts + type + pure fn) → `CalendarCell` to `types/`; rest to `lib/dashboard-calendar.ts`. Reason: pure date math = lib.
- `hooks/use-week-bars.tsx` keeps `.tsx` extension despite hooks-naming rule saying `.ts`. Reason: file contains JSX (bar `<div>`s); renaming to `.ts` would break compilation. Rule yields to compiler.
- `WEEK_LABELS` duplicated in `calendar.ts` and `use-week-bars.tsx` → deduped to single export in `lib/dashboard-calendar.ts`, hook imports it. Values identical (`as const`).
- `BreakMarker`/`WeekBarData` declared identically in both `EmployeeDashboardPage.tsx` and `use-week-bars.tsx` → single definitions in `types/`, both import.
- `schema/` has no schemas (dashboard has no forms) → `schema/index.ts` documents that instead of omitting the folder. Reason: target structure wants the bucket; an honest empty barrel beats a missing one.
- `routes.tsx` stays at module root (not in any target bucket). Reason: convention across all 10 modules + app router imports from module roots; moving it would churn the whole app router for no gain.
- `data/mock.ts` stays (not in target buckets). Reason: mock-seed data used by api layer when `env.useMockApi`; shared convention, out of scope.
- Component prop annotations use anonymous inline object literals (`{ x }: { x: string }`), no named `Props` declarations. Reason: complies with "no named type/interface outside `types/`" while keeping props co-located and readable.
- `api/dashboard-api.ts` keeps `as unknown as` defensive normalization casts exactly as before — not cleaned up (pure refactor, zero behavior change).
- `use-executive-decision.ts` (new): the `useMutation(decideApproval…)` wiring moved out of `ExecutiveDashboardPage` into a hook. `decideApproval` itself stays in the approvals module (cross-module import preserved, not duplicated).
- `ExecutiveTrends` takes `showAttendance`/`showPipeline` booleans instead of the full `sections` map. Reason: narrower props, component stays presentational.
- `ExecutiveBottomRow` keeps pending-approvals + activity-feed + calendar together in one grid component (they form a single responsive row). Further split only if a panel exceeds 150 lines.
- `EmployeeHero`/`ExecutiveHero` `meta` props typed via `EmployeeDashboardData['meta']` / `ExecutiveDashboardData['meta']` indexed access — no new named types declared.
