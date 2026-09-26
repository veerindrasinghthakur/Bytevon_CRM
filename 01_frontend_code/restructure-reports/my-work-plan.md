# my-work — inventory & plan (~74 files, heaviest pages + 1188-line api)

Validation library: **zod** (22 schema files). Stay with zod.

## Inventory summary

- Root: `index.ts` 31, `routes.tsx` 172, `types.ts` 133 (real types at root — misplaced), `quick-actions.ts` 19 (inline `QuickAction`).
- `api/`: `my-work.ts` **1188 lines** (attendance/leave/tasks/approvals everything) + `profile.ts` 217. No inline named types detected in api (shapes come from schemas) — but file is 5–10× too big.
- `components/`: `BreakStatusCard.tsx` 132; `attendance/*` 145/57/112; `leave/LeaveBalanceTab` 139, `LeaveCalendarTab` **262 LARGE-COMP** (inline `CalendarLeave`), `LeaveHistoryTab` **229 LARGE-COMP**.
- `hooks/`: LARGE-HOOKS: `use-apply-leave.ts` 253, `use-attendance-corrections.ts` 258, `use-mark-attendance.ts` 285 (inline `WorkStatus`); small: `use-leave-page-state` 18 (inline `Tab`), `use-leave-thread` 39, `use-my-*` 21–98, `use-requests-page-filter` 12 (inline `RequestFilter`), `useLeaveCalculations.ts` 52 (**naming** → `use-leave-calculations.ts`).
- `pages/` LARGE-PAGES: `ProfilePage` **601** (!), `LeaveDetailPage` 486, `MyAttendancePage` 377, `MyRequestsPage` 358 (inline `UnifiedRow`, `Tab`), `ApplyLeavePage` 333, `MyWorkOverviewPage` 316, `MarkAttendancePage` 273, `MyTasksPage` 265, `MyTaskCreatePage` 234, `AttendanceCorrectionsPage` 215, `MyTaskDetailPage` 205, `TakeABreakPage` 194 (borderline), `ChangePasswordPage` 176, `MyApprovalDetailPage` 176, `AttendanceDetailPage` 166, `MyApprovalsPage` 139, `MyLeavePage` 127, `ActiveSessionsPage` 101, `MyBankDetailsPage` 148.
- `schemas/` (22 files, plural → `schema/` + `.schema.ts`): real zod modules; `z.infer` aliases stay in schema (derived, not hand-declared); hand-declared `TodayAttendanceSession`, `WorkHoursSummary` (attendance.ts), `ProfileFormInput` (profile-form.ts), `WorkLogRow`, `BreakSeg` (working-hours-log.ts), `TaskFilter` (enums.ts) → move to `types/`.
- No `types/` folder — root `types.ts` only.
- `lib/`: attendance-session 136, break-session 229, maskAccount 4 (**naming** → `mask-account.ts`), working-hours-log 15.

## Type extraction plan → `types/*.types.ts`

- `types/my-work.types.ts`: root `types.ts` + `QuickAction` (quick-actions.ts).
- `types/leave.types.ts`: `CalendarLeave` (LeaveCalendarTab), `Tab` (use-leave-page-state), `UnifiedRow` + page `Tab` (MyRequestsPage — rename to `RequestTab` to avoid clash).
- `types/attendance.types.ts`: `WorkStatus` (use-mark-attendance), `TodayAttendanceSession`, `WorkHoursSummary` (schemas), `WorkLogRow`, `BreakSeg`, `TaskFilter`→tasks? (place TaskFilter in task types).
- `types/request.types.ts`: `RequestFilter`; `types/task.types.ts`: `TaskFilter`.
- Barrel `types/index.ts`.

## Split plan (biggest risks first)

- `api/my-work.ts` 1188 → `api/attendance-api.ts`, `api/leave-api.ts`, `api/task-api.ts`, `api/approval-api.ts`, `api/my-work-api.ts` (residual/shared) — split by resource, keep function names identical.
- `ProfilePage` 601 → page + `components/profile/profile-hero.tsx`, `profile-details-form.tsx`, `profile-sessions.tsx`, `profile-activity.tsx` + reuse existing hooks.
- `LeaveDetailPage` 486 → page + `components/leave/leave-detail-header.tsx`, `leave-timeline.tsx`, `leave-actions.tsx`.
- `MyAttendancePage` 377 → page + `components/attendance/attendance-summary.tsx`, `attendance-week-view.tsx`.
- `MyRequestsPage` 358 → page + `components/requests/requests-table.tsx`, `requests-filter.tsx`.
- `ApplyLeavePage` 333, `MyWorkOverviewPage` 316, `MarkAttendancePage` 273, `MyTasksPage` 265 → same pattern (form/table/section components).
- `LeaveCalendarTab` 262 → `leave-calendar-tab.tsx` + `leave-calendar-grid.tsx`; `LeaveHistoryTab` 229 → + `leave-history-table.tsx`.
- `use-apply-leave` 253, `use-attendance-corrections` 258, `use-mark-attendance` 285 → each split into query hook + form/state hook (e.g. `use-mark-attendance.ts` + `use-mark-attendance-form.ts`).

## Rename / move plan (via `git mv`)

- `schemas/` → `schema/` + `.schema.ts`; `useLeaveCalculations.ts` → `use-leave-calculations.ts`; `lib/maskAccount.ts` → `lib/mask-account.ts`; `quick-actions.ts` → `lib/quick-actions.ts` (pure data, logged) or keep root with re-export — decide during execution.
- `api/my-work.ts` split as above (use `git mv` for first chunk, create rest as moves of extracted ranges — history preserved on the main chunk).
- New barrels everywhere.

## Import fixes (whole repo)

- `@/modules/my-work/api/my-work` imported by many pages/hooks/tests (mywork-api.test.ts) → new per-resource paths.
- `types` root → `types/*`; `useLeaveCalculations` → kebab path; `maskAccount` → kebab.

## Verification

`npx tsc -b`, `npx eslint src/modules/my-work`, `npx vite build`, `vitest run tests/mywork-api.test.ts src/modules/my-work`. Highest-risk module for import churn — verify after api split before touching pages.
