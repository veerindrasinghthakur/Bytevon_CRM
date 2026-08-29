# Module Verification Report: my-work

## 1. Action Required Summary

### Pages Needing Refactoring

- **MyWorkOverviewPage.tsx** — Inline strings for quick actions (`/my-work/leave/apply`, etc.), hardcoded hex colors (`text-error`, `text-emerald-600`, `text-amber-600`), uses `safeNavigate` but some buttons lack it
- **MyAttendancePage.tsx** — Hardcoded route strings (`/my-work/attendance/corrections`, `/my-work/attendance/mark`, `/my-work/break`, `/my-work/attendance/$attendanceId`) instead of `myWorkRoutes` helpers, inline status badge colors (`text-emerald-600`)
- **MyLeavePage.tsx** — Manual `useState` for `tab` and `calMonth` (should extract to custom hook), hardcoded route string in LeaveHistoryTab button (`/my-work/leave/apply`)
- **MyTasksPage.tsx** — Manual `useState` for `cardFilter`, hardcoded route strings (`/my-work/tasks/new`, `/my-work/tasks/$taskId`) instead of `myWorkRoutes`
- **MyTaskCreatePage.tsx** — Inline Zod schema (should use shared `myTaskFormSchema` from types), hardcoded route `/my-work/tasks`
- **MyApprovalsPage.tsx** — Inline `statusStyles` with hardcoded hex colors (`bg-amber-50`, `bg-emerald-50`, `bg-red-50`), hardcoded route strings (`/my-work/approvals/$requestId`)
- **ApplyLeavePage.tsx** — Hardcoded route strings in multiple places, inline calendar cell generation logic (should be in hook/API)
- **MarkAttendancePage.tsx** — Imports mock data (`currentUser`), duplicate inline status styles with hex colors, hardcoded route strings
- **MyRequestsPage.tsx** — Manual `useState` for `filter`, inline `StatCard` with hardcoded hex colors (`bg-amber-100`, `bg-blue-100`, `bg-red-100`), hardcoded route strings
- **MyBankDetailsPage.tsx** — Manual `useState` for `isEditing` and `toast`, template literal bug line 15 (`${num.slice(-4)}` without backticks), inline `maskAccount` function
- **MyTaskDetailPage.tsx** — Imports mock data, duplicates `priorityClass` and `statusDot` from `schemas/enums.ts`, hardcoded route strings (`/my-work/tasks/new`, `/my-work/tasks`)
- **MyApprovalDetailPage.tsx** — Imports mock data, duplicates `statusStyles` and `typeIcon` from `schemas/enums.ts`, hardcoded route strings
- **AttendanceDetailPage.tsx** — Imports mock data, duplicates `statusStyles` from `schemas/enums.ts`, hardcoded route strings
- **LeaveDetailPage.tsx** — Imports mock data, duplicates `statusStyles` from `schemas/enums.ts`, hardcoded route strings
- **AttendanceCorrectionsPage.tsx** — Inline `STATUS_STYLES` with hardcoded hex colors, modal form uses `useState` instead of React Hook Form, hardcoded route strings
- **TakeABreakPage.tsx** — Manual `useState` for `session`, `minutesInput`, `note`, `tick` (should extract to custom hook), hardcoded route string

### Hooks Needing Refactoring

- **use-apply-leave.ts** — Local compute logic: `countLeaveDays`, calendar `cells` generation, `toISO`/`todayISO` (should be API fields or shared utils), direct `navigate()` in `goBackToLeave` (uses `safeNavigate` but hook returns it)
- **use-mark-attendance.ts** — Local compute logic: `dayPct`, `isOnTime`, `shiftStartToday`, `formatClockTime`/`formatHoursCompact` (re-exported from lib), direct `safeNavigate` calls in `submitManual` and `goCorrections`
- **use-attendance-corrections.ts** — Local state: `modalOpen`, `selectedDateId`, `checkIn`, `checkOut`, `reason`, `approverId`, `approverQuery`, `localExtra` (optimistic updates), local compute: `filteredApprovers` memo, direct `safeNavigate` not used (page handles navigation)

## 2. Orphan Files Identified

- **data/mock.ts** — Thin re-export of `@/shared/mock/data/my-work`; all detail pages import mock data directly instead of using API/hooks. Consider removing if no consumers remain.
- **schemas/enums.ts** — Central enum definitions but multiple pages duplicate these locally (MyTaskDetailPage, MyApprovalDetailPage, AttendanceDetailPage, LeaveDetailPage, AttendanceCorrectionsPage, MyApprovalsPage, MyRequestsPage). Should enforce single source of truth.
- **hooks/useLeaveCalculations.ts** — Duplicate `countLeaveDays`, `toISO`, `todayISO` logic also present in `use-apply-leave.ts`. Consolidate to one location.
- **components/leave/LeaveCalendarTab.tsx** — Imported in MyLeavePage but not analyzed; verify usage.
- **schemas/bank-form.ts** — Not analyzed; verify if used exclusively by MyBankDetailsPage.

## 3. Form & Type Violations

- **MyLeavePage.tsx** — Uses `useState<Tab>` and `useState<Date>` for tab/calendar state instead of React Hook Form + Zod
- **MyTasksPage.tsx** — Uses `useState<TaskFilter>` for `cardFilter` instead of React Hook Form
- **MyAttendancePage.tsx** — Uses `useState<number>` for `tick` (live clock) — acceptable but could use `useSyncExternalStore`
- **MyBankDetailsPage.tsx** — Uses `useState<boolean>` for `isEditing` and `useState<string|null>` for `toast`; form uses RHF correctly but UI state does not
- **TakeABreakPage.tsx** — Uses `useState` for `session`, `minutesInput`, `note`, `tick` — all form/UI state, should use RHF for form fields
- **MyRequestsPage.tsx** — Uses `useState` for `filter` (filter chips)
- **AttendanceCorrectionsPage.tsx** — Modal form uses `useState` for all fields (`selectedDateId`, `checkIn`, `checkOut`, `reason`, `approverId`, `approverQuery`) instead of React Hook Form + Zod
- **ManualAttendanceForm.tsx** — Receives form state via props and uses `useState` in parent hook; should use React Hook Form internally
- **MyTaskDetailPage.tsx:7-20** — Duplicate `priorityClass` and `statusDot` Record definitions with `string` index signature (loose typing)
- **MyApprovalDetailPage.tsx:8-19** — Duplicate `statusStyles` and `typeIcon` Record definitions
- **AttendanceDetailPage.tsx:11-18** — Duplicate `statusStyles` Record definition
- **LeaveDetailPage.tsx:10-15** — Duplicate `statusStyles` Record definition
- **AttendanceCorrectionsPage.tsx:16-21** — Duplicate `STATUS_STYLES` Record definition
- **routes.tsx:48** — `eslint-disable-next-line @typescript-eslint/no-explicit-any` for `createMyWorkRoutes` parameter
- **MyBankDetailsPage.tsx:15** — Template literal bug: `'\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${num.slice(-4)}'` missing backticks (uses single quotes)