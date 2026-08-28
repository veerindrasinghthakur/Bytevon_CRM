# Module Verification Report: Dashboard

## 1. Action Required Summary

### Pages Needing Refactoring
- **PayrollDashboardPage.tsx** — Inline hardcoded data arrays (lines 36-48, 64-70, 99-102, 134-137); hardcoded hex colors in inline styles (line 90: `#0059bb`, `#0b1c30`); manual table rendering with static mock data; no extraction to hooks or API-driven data
- **ExecutiveDashboardPage.tsx** — Direct `navigate()` calls (lines 46, 161, 185) should use `safeNavigate()`; inline hardcoded select options (lines 79-82) and calendar day arrays (lines 199-202); inline style with hardcoded color strings (lines 226-227: `text-error`, `text-white`, `bg-error`); complex JSX logic in render should move to custom hook
- **EmployeeDashboardPage.tsx** — Direct `navigate()` calls (lines 67, 101, 209) should use `safeNavigate()`; inline hardcoded calendar arrays (lines 199-207); complex weekBars rendering logic inline (lines 118-167) should extract to custom hook; type assertions with `as` (lines 27-28) indicate missing proper types

### Hooks Needing Refactoring
- **use-executive-dashboard.ts** — Hardcoded query key `['dashboard', 'executive']` (line 6) should use centralized query key factory
- **use-employee-dashboard.ts** — Hardcoded query key `['dashboard', 'employee']` (line 6) should use centralized query key factory

## 2. Orphan Files Identified
- None — all files are imported/exported via `index.ts` and used in routing

## 3. Form & Type Violations
- **routes.tsx:30** — Uses `any` type for `appLayoutRoute` parameter (eslint disable comment present)
- **EmployeeDashboardPage.tsx:27-28** — Type assertions with `as` for `meta` property access instead of proper discriminated union types
- No manual `useState` forms found in this module
- No React Hook Form + Zod usage detected (no forms exist in dashboard pages currently)