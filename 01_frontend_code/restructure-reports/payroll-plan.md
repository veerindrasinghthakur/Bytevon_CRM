# payroll — inventory & plan (~52 files)

Validation library: **zod** (4 schema files). Stay with zod.

## Inventory summary

- Root: `index.ts` 42, `routes.tsx` 170, `types.ts` 85 (real types at root — misplaced; no `types/` folder).
- `api/` (10 files): `_helpers.ts` **440** (underscore violation; pure helpers → belongs in `lib/`), `salary.ts` 158, `review.ts` 146 (inline `PayPayrollInput`), `run.ts` 69, `monthly.ts` 77, `payslip.ts` 45, `history.ts` 42, `dashboard.ts` 33, `payroll.ts` 33, `index.ts` 9. Rest rename → `*-api.ts`.
- `components/`: 4 tiny (29–32 lines) + `review/ManualPayModal` **173 LARGE-COMP** (inline `ManualPayForm`), `review/RecordPaymentModal` 154 (borderline, split if mixed concerns).
- `hooks/`: stubs `use-payroll.ts` 10, `use-run-payroll.ts` 1 (+ real `run/use-run-payroll.ts` 54 — dupe name); LARGE-HOOK: `monthly/use-monthly-detail.ts` **221** (inline `AttendanceDetail`); rest small (24–102).
- `pages/` (13 files, ALL LARGE-PAGE): `PayrollReviewPage` 370, `MonthlyPayrollPage` 365, `AddSalaryPage` 334, `MonthlyPayrollDetailPage` 321, `ReviseSalaryPage` 310, `PayrollDashboardPage` 297, `PayrollHistoryPage` 285, `RunPayrollPage` 253, `PayslipViewPage` 255, `EmployeeSalaryDetailPage` 231, `EmployeePayrollHistoryPage` 234, `GeneratingPayrollPage` 207, `SalaryManagementPage` 205.
- `schemas/`: `payroll.ts` 175, `enums.ts` 62, `salary-form.ts` 42, `employee-list-response.ts` 12 → `schema/*.schema.ts`.
- Baseline lint: **1 pre-existing error** `react/no-unescaped-entities` in `MonthlyPayrollDetailPage.tsx:265` — must fix (`'` → `&apos;`) as part of the split (behavior-neutral), log it.

## Type extraction plan → `types/*.types.ts` (new folder)

- `types/payroll.types.ts`: root `types.ts` + `PayPayrollInput` (api/review) + `AttendanceDetail` (hook) + `ManualPayForm` (component).

## Split plan

- Every page >200 → thin page + section components (KPIs, tables, forms). Concretely: `PayrollReviewPage` 370 → + `components/review/review-summary.tsx`, `review-table.tsx`; `MonthlyPayrollPage` 365 → + `components/monthly/monthly-table.tsx`, `monthly-filters.tsx`; same pattern for the other 11.
- `use-monthly-detail` 221 → query hook + `use-monthly-attendance.ts`.
- `api/_helpers.ts` 440 → `lib/payroll-helpers.ts` (pure) — anything with hooks/query stays in `api/`.
- `ManualPayModal` 173 → modal shell + `manual-pay-form.tsx`.

## Rename / move plan (via `git mv`)

- New `types/`; `api/*.ts` → `*-api.ts` (except folded helpers); `schemas/` → `schema/*.schema.ts`; resolve `use-run-payroll` dupe (stub deleted, real file moved to `hooks/use-run-payroll.ts`).
- New barrels everywhere.

## Import fixes (whole repo)

- `api/_helpers` importers (many payroll pages/api) → `lib/payroll-helpers`.
- payroll tests (payroll-schemas.test.ts) schema paths.

## Verification

`npx tsc -b`, `npx eslint src/modules/payroll` (must go from 1 error to 0 — the apostrophe fix), `npx vite build`, `vitest run tests/payroll-schemas.test.ts src/modules/payroll`.
