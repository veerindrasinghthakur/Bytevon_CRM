# Module Verification Report: Sales

## 1. Action Required Summary

### Pages Needing Refactoring

- **SalesDashboardPage.tsx** — Replace `useNavigate` with `safeNavigate` (line 33); replace inline route strings with `salesRoutes`; extract `StatusDot` component to shared UI; replace hardcoded hex colors (`text-emerald-700`, `bg-emerald-500`, `text-red-700`, `bg-red-50`) with CSS variables; extract revenue/monthly-growth/funnel/logic to custom hooks
- **LeadCreatePage.tsx** — Replace manual `useState` form (lines 48-49) with React Hook Form + Zod (`leadFormSchema`); replace `useNavigate` with `safeNavigate`
- **LeadDetailPage.tsx** — Remove duplicate `STAGES` array (lines 13-21); extract `StatusDot` to shared; replace hardcoded colors with CSS variables; extract pipeline progress logic to hook
- **ClientsListPage.tsx** — OK (uses `safeNavigate` and `salesRoutes` correctly)
- **ClientCreatePage.tsx** — Replace manual `useState` form (lines 35-37) with React Hook Form + Zod (`clientFormSchema`); replace `useNavigate` with `safeNavigate`
- **ClientDetailPage.tsx** — OK (uses `safeNavigate` and `salesRoutes` correctly)
- **SalesAnalyticsPage.tsx** — Replace inline `useQuery` with `useSalesDashboardMetrics` hook (already imported but not used); remove duplicate `stages` array (lines 11-19) and `stageColors` object (lines 21-29) — use `PipelineStageValues` and `stageColors` from `cssTokens.ts`
- **SalesActivityTimelinePage.tsx** — Replace inline `useQuery` with `useSalesActivities` hook (already imported but not used); remove duplicate `typeIcon` object (lines 11-21) — use `typeIcon` from `cssTokens.ts`
- **CaseStudiesListPage.tsx** — Fix non-functional Edit/Share buttons (lines 215-230) — add `onClick` handlers or remove; replace hardcoded `statusStyles` reference (line 40) with `caseStudyStatusStyles` from `cssTokens.ts`

### Hooks Needing Refactoring

- **use-sales.ts** — Hardcoded query key patterns in `findLeadInCache`/`findClientInCache`/`upsertLeadInLists`/`upsertClientInLists` (lines 39-93) — consider centralizing cache helpers; `onMutate` optimistic updates use `any` inference on patch types
- **use-sales-dashboard.ts** — Hardcoded `funnelStages` array (lines 5-12) — use `PipelineStageValues` from `enums.ts`; hardcoded `typeIcon` object (lines 14-24) — use `typeIcon` from `cssTokens.ts`; local compute logic (`recentLeadsData`, `topClientsData` lines 43-44) — move to API response fields
- **use-case-studies-list.ts** — Client-side filtering logic (lines 19-31) — replace with server-side filter params via API; no pagination support
- **use-leads-list.ts** — OK (uses shared hooks, server-side filters)
- **use-clients-list.ts** — OK (uses shared hooks, server-side filters)

## 2. Orphan Files Identified

- **components/LeadFiltersBar.tsx** — Defined but not imported/used anywhere (LeadsListPage uses `ListToolbar` instead)
- **data/mock.ts** — Mock data store; only used when `env.useMockApi=true`; consider moving to `__mocks__` or test fixtures
- **data/mock-seed.ts** — Seed data for mock; same as above

## 3. Form & Type Violations

- **LeadCreatePage.tsx** — Manual `useState` for entire form (lines 48-49, 51-73) instead of React Hook Form + Zod (`leadFormSchema` available in `schemas/lead-form.ts`)
- **ClientCreatePage.tsx** — Manual `useState` for form + contacts array (lines 35-37, 39-82) instead of React Hook Form + Zod (`clientFormSchema` available in `schemas/client-form.ts`)
- **routes.tsx** — Explicit `any` type on line 35 (`createSalesRoutes(appLayoutRoute: any)`) — replace with proper `Route` type from `@tanstack/react-router`
- **use-sales.ts** — Implicit `any` in `onMutate` patch types (lines 144, 210) — add explicit generic types to `useMutation`
- **SalesAnalyticsPage.tsx** — `metrics?.find(...)` returns `SalesMetric | undefined` but accessed without null checks (lines 51-53)