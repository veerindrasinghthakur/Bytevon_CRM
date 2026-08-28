# Module Verification Report: approvals

## 1. Action Required Summary

### Pages Needing Refactoring
- **ApprovalCenterPage.tsx** — Extract `KpiCard` and `priorityStyles` to shared UI/components; replace hardcoded hex colors (`bg-red-100`, `bg-amber-100`, `bg-emerald-100`, `bg-red-700`, `bg-amber-700`, `bg-emerald-700`, `bg-blue-50`, `bg-surface-container`) with CSS variables; replace direct `navigate({ to: '/approvals/pending' })` with `safeNavigate()`; inline `<select>` filters should use shared `Select` component
- **PendingApprovalsPage.tsx** — Replace hardcoded hex colors in `priorityDot` (`bg-red-500`, `bg-amber-500`, `bg-blue-500`, `bg-slate-400`) and `priorityStyles` with CSS variables; replace direct `navigate({ to: '/approvals/$requestId', params: { requestId: row.id } })` with `safeNavigate()`; extract `ApprovalQuickContent` to separate component file
- **ApprovalDetailPage.tsx** — Replace manual `useState` for `comment` and `actionDone` with React Hook Form + Zod schema; replace hardcoded hex colors (`bg-emerald-50`, `bg-red-50`, `bg-amber-50`, `bg-secondary/15`, `bg-red-50`, `bg-emerald-500`, `bg-red-500`, `bg-amber-500`) with CSS variables; replace direct `navigate({ to: '/approvals/pending' })` with `safeNavigate()`; remove direct mock data import (`pendingApprovals` from `../data/mock`) — use hook instead; extract `TimelineStep` to shared component
- **MyRequestsPage.tsx** — Replace manual `useState` for `filter` with React Hook Form + Zod (or `useListControls`); replace hardcoded hex colors in `statusStyles` (`bg-amber-50`, `bg-emerald-50`, `bg-red-50`, `bg-amber-200`, `bg-emerald-200`, `bg-red-200`, `bg-emerald-500`, `bg-red-500`, `bg-amber-500`) with CSS variables; remove direct mock data import (`myRequests` from `../data/mock`) — use `useMyRequests` hook; move local compute logic (`stats` useMemo) to API/hook layer

### Hooks Needing Refactoring
- **use-approval-center.ts** — Replace hardcoded query keys `['approvals', 'kpis']` and `['approvals', 'pending', 'center']` with centralized `queryKeys` from `@/shared/lib/query-keys`; local compute `rows = pending.slice(0, 5)` and `showingCount = Math.min(10, pending.length)` should move to API/selector
- **use-pending-approvals.ts** — Local compute `types = Array.from(new Set(filtered.map(r => r.type))).sort()` should be provided by API or selector; otherwise uses `queryKeys` correctly
- **use-my-requests.ts** — Replace hardcoded query key `['approvals', 'my-requests', search, statusFilter]` with centralized `queryKeys`; replace manual `useState` for `search` and `statusFilter` with `useListControls`; local `filtered = items` is redundant

## 2. Orphan Files Identified
- **MyRequestsPage.tsx** — Exported in `index.ts` but route `/approvals/my-requests` redirects to `/my-work/requests` (see `routes.tsx:30-36`); page is unreachable via approvals module routing and appears dead unless linked elsewhere
- **data/mock.ts** — Imported directly by `ApprovalDetailPage.tsx` and `MyRequestsPage.tsx` (violates separation); should only be used by `api/approvals.ts`

## 3. Form & Type Violations
- **ApprovalDetailPage.tsx:11-12** — Manual `useState` for `comment` (string) and `actionDone` (`'approved' | 'rejected' | 'revision' | null`) — should use React Hook Form + Zod schema
- **MyRequestsPage.tsx:20** — Manual `useState<(typeof filters)[number]>` for `filter` — should use React Hook Form + Zod or `useListControls`
- **use-my-requests.ts:6-7** — Manual `useState` for `search` and `statusFilter` — should use `useListControls`
- **routes.tsx:13** — Explicit `any` type via `// eslint-disable-next-line @typescript-eslint/no-explicit-any` on `appLayoutRoute` parameter
- **ApprovalCenterPage.tsx:7-12** — `priorityStyles` uses string index `Record<string, string>` — should be `Record<ApprovalPriority, string>` for type safety
- **PendingApprovalsPage.tsx:25-37** — `priorityStyles` and `priorityDot` use `Record<string, string>` — should be typed with `ApprovalPriority`
- **MyRequestsPage.tsx:10-15** — `statusStyles` uses `Record<string, string>` — should be `Record<ApprovalStatus, string>`