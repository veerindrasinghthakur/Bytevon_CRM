# approvals — inventory & plan

Validation library: **zod** (`schemas/approval.ts`). Stay with zod.

## Inventory (22 files)

| File | Lines | Contains | Fails |
|---|---|---|---|
| `index.ts` | 9 | barrel | OK; extend |
| `routes.tsx` | 59 | route defs | OK at root (logged) |
| `types.ts` | 3 | stub re-export | **stub** → remove after `types/` real files carry the weight |
| `enums.ts` | 58 | ApprovalStatus/ApprovalPriority consts + 2 derived types | **misplaced** (root; types must go to `types/`, consts to `schema/` enums or `lib/`) |
| `api/approvals.ts` | 11 | stub/barrel-ish | **ambiguous** (near-empty; likely fold into `api/index.ts`) |
| `api/approval_action.ts` | 64 | decide/withdraw fns + `DecideAction` (line 51) | **inline type**; **naming** → `approval-action-api.ts` (also snake_case → kebab) |
| `api/request.ts` | 55 | request list/detail fns | **naming** → `request-api.ts` |
| `components/approval_action/ApprovalQuickContent.tsx` | 40 | small presenter + `interface ApprovalQuickContentProps` (line 11) | **inline interface**; **naming/folder** → `components/approval-quick-content.tsx` |
| `data/mock.ts` | 132 | mock approvals | OK as `data/` (logged) |
| `hooks/use-approval-center.ts` | 2 | stub re-export shadowing `hooks/request/use-approval-center.ts` | **stub/dupe** → delete stub, keep real file (git mv, fix imports) |
| `hooks/use-my-requests.ts` | 2 | stub shadowing `hooks/request/use-my-requests.ts` | same as above |
| `hooks/use-pending-approvals.ts` | 2 | stub shadowing `hooks/approval_action/use-pending-approvals.ts` | same as above |
| `hooks/approval_action/use-pending-approvals.ts` | 60 | pending list + filter memo | **folder snake_case** → `hooks/use-pending-approvals.ts` |
| `hooks/request/use-approval-center.ts` | 44 | center query | → `hooks/use-approval-center.ts` |
| `hooks/request/use-my-requests.ts` | 45 | my requests query | → `hooks/use-my-requests.ts` |
| `pages/approval_action/PendingApprovalsPage.tsx` | 221 | **LARGE-PAGE**; table + filter + decide actions | **split** (filter bar + table components) |
| `pages/request/ApprovalCenterPage.tsx` | 221 | **LARGE-PAGE**; KPIs + list | **split** |
| `pages/request/ApprovalDetailPage.tsx` | 289 | **LARGE-PAGE**; detail + timeline + decide form | **split** (detail header, timeline, decision form) |
| `pages/request/MyRequestsPage.tsx` | 174 | list + filter | OK size |
| `schemas/approval.ts` | 8 | 1 zod schema + `ApprovalActionFormInput` infer | **naming/folder** → `schema/approval.schema.ts` |
| `types/approval_action.ts` | 4 | near-stub | **naming** → `types/approval-action.types.ts`; merge content |
| `types/request.ts` | 25 | request row/params shapes | **naming** → `types/request.types.ts` |

Missing/weak checks: `types/` exists but thin (4 + 25 lines) while `enums.ts` + inline types live elsewhere; 3 stub hooks shadow real ones; snake_case folders (`approval_action`) violate kebab-case.

## Type extraction plan

- `types/approval-action.types.ts`: `DecideAction` (api) + `ApprovalQuickContentProps` (component) + existing stub content + `ApprovalStatus`, `ApprovalPriority` (from root `enums.ts`).
- `types/request.types.ts`: keep + absorb any request row shapes found in pages during execution.
- `types/index.ts` barrel; delete root `types.ts` stub (re-export shim only if external imports need it — check first).

## Split plan

- `PendingApprovalsPage` (221) → page + `components/pending-approvals-table.tsx` + `components/pending-approvals-filter.tsx`.
- `ApprovalCenterPage` (221) → page + `components/approval-center-kpis.tsx` + `components/approval-center-list.tsx`.
- `ApprovalDetailPage` (289) → page + `components/approval-detail-header.tsx` + `components/approval-timeline.tsx` + `components/approval-decision-form.tsx`.
- `enums.ts` → types to `types/`; runtime consts → `schema/approval-enums.schema.ts` (zod-adjacent) or `lib/`; decide during execution (log).

## Rename / move plan (via `git mv`)

- Flatten `hooks/approval_action/*`, `hooks/request/*`, `pages/approval_action/*`, `pages/request/*`, `components/approval_action/*` to kebab-case directly under their buckets.
- `api/approval_action.ts` → `api/approval-action-api.ts`; `api/request.ts` → `api/request-api.ts`; fold `api/approvals.ts` stub into `api/index.ts` if empty.
- `schemas/` → `schema/` + `.schema.ts` suffix; `types/*` → `.types.ts` suffix.
- New barrels per bucket + root.

## Import fixes (whole repo)

- Dashboard `decideApproval` import (`modules/dashboard/pages/ExecutiveDashboardPage.tsx`) → new api path.
- All `@/modules/approvals/hooks/use-*` stub paths keep working (stubs deleted, real files moved to same paths — verify).
- tests/approvals-api.test.ts paths.

## Verification

`npx tsc -b`, `npx eslint src/modules/approvals`, `npx vite build`, `vitest run tests/approvals-api.test.ts src/modules/approvals`.
