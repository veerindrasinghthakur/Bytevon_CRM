# Module Verification Report: payroll

## 1. Action Required Summary

### Pages Needing Refactoring
- **PayrollDashboardPage.tsx** — Replace inline `statusStyles` with CSS variables; replace hardcoded `navigate({ to: '/payroll/*' })` with `payrollRoutes` + `safeNavigate`; extract search/filter logic to custom hook
- **MonthlyPayrollPage.tsx** — Replace hardcoded route strings with `payrollRoutes`; replace inline `statusBadge` with CSS variables; extract demo view state (`view`, `detailsOpen`, `month`, `year`) to hook or form; replace manual `useState` search with `useListControls`
- **RunPayrollPage.tsx** — Replace hardcoded route strings with `payrollRoutes`; extract hardcoded month/year selects to constants/hook; replace inline `select` elements with `Select` component
- **GeneratingPayrollPage.tsx** — Already uses `safeNavigate` + `payrollRoutes` ✓; extract hardcoded `STEPS` array to constants; remove inline SVG gradient `style` prop
- **PayrollReviewPage.tsx** — Replace hardcoded route string in `navigate({ to: '/payroll/payslip/$employeeId' })` with `payrollRoutes.payslip(emp.id)`; convert `RecordPaymentModal` manual `useState(paymentRef)` + inputs to React Hook Form + Zod; replace inline hex colors (`#166534`, `#dcfce7`, `#c5221f`) with CSS variables
- **PayslipViewPage.tsx** — Replace hardcoded route strings with `payrollRoutes`; replace inline `exportAndDownload` call with shared export pattern
- **SalaryManagementPage.tsx** — Replace hardcoded route strings with `payrollRoutes`; already uses `safeNavigate` ✓
- **EmployeeSalaryDetailPage.tsx** — Replace hardcoded route strings with `payrollRoutes`
- **ReviseSalaryPage.tsx** — Replace hardcoded route strings with `payrollRoutes`; convert manual `useState(rows, effectiveFrom)` + inline form to React Hook Form + Zod using `salaryFormSchema`; extract inline `Select` options to constants
- **EmployeePayrollHistoryPage.tsx** — Replace hardcoded route strings with `payrollRoutes`; replace manual `useState(yearFilter, statusFilter)` + local `.filter()` with `useListControls`; replace inline `statusStyle` hex colors with CSS variables
- **PayrollHistoryPage.tsx** — **CRITICAL**: Uses local mock import `../data/mock` (file missing) instead of API; replace hardcoded route strings with `payrollRoutes`; replace manual `useState(search)` with `useListControls`; replace inline `paidRecords` array with API-driven data

### Hooks Needing Refactoring
- **use-payroll.ts** — `usePayrollDashboard`: hardcoded query key `scope: 'dashboard'`; `useMonthlyPayroll`: local compute logic for `totals` (gross/net/earnings/deductions) — move to API response `metrics`; `usePayrollReview`: `navigate()` in `payMut.onSuccess` — replace with `safeNavigate` + `payrollRoutes`; `useReviseSalary`: manual `useState(rows, effectiveFrom)` — replace with React Hook Form; `useEmployeePayrollHistory`: local compute `ytdNet`, `avgNet` — move to API; `useRunPayroll`: `previewMetrics` local transform — move to API

## 2. Orphan Files Identified
- **hooks/use-payroll-dashboard.ts** — Single-line re-export; verify no external imports before removing
- **hooks/use-monthly-payroll.ts** — Single-line re-export; verify no external imports before removing
- **hooks/use-employee-payroll-history.ts** — Single-line re-export; verify no external imports before removing
- **hooks/use-payroll-review.ts** — Single-line re-export; verify no external imports before removing
- **hooks/use-run-payroll.ts** — Single-line re-export; verify no external imports before removing
- **pages/PayrollHistoryPage.tsx** — Dead page if not routed; currently uses local mock data and non-standard patterns; confirm routing in parent app

## 3. Form & Type Violations
- **ReviseSalaryPage.tsx** — Manual `useState` form (`rows`, `effectiveFrom`) instead of React Hook Form + Zod (`salaryFormSchema` from `schemas/salary-form.ts`)
- **PayrollReviewPage.tsx** — `RecordPaymentModal` uses manual `useState(paymentRef)` + raw inputs; should use React Hook Form + Zod
- **routes.tsx:43** — `eslint-disable @typescript-eslint/no-explicit-any` on `createPayrollRoutes(appLayoutRoute: any)`
- **PayrollDashboardPage.tsx:8-12** — Inline `statusStyles` object with hardcoded Tailwind color classes (not CSS variables)
- **MonthlyPayrollPage.tsx:16-20** — Inline `statusBadge` object with hardcoded Tailwind color classes
- **PayrollReviewPage.tsx:93-94, 105, 202-203** — Inline hex colors (`#166534`, `#dcfce7`, `#c5221f`, `#137333`) instead of CSS variables
- **EmployeePayrollHistoryPage.tsx:10-14** — Inline `statusStyle` object with hardcoded hex colors
- **PayrollHistoryPage.tsx** — Imports `payrollEmployees, formatMoney` from `../data/mock` (non-existent path); uses hardcoded `paidRecords` array