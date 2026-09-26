# sales — inventory & plan (~85 files)

Validation library: **zod** (nested `schemas/*/*.ts`). Stay with zod.

## Inventory summary

- Root: `index.ts` 48, `routes.tsx` 150, `types.ts` 248 (real God-types at root — misplaced).
- `api/`: `lead.ts` **455**, `client.ts` 289 (inline `ClientContactInput`), `source.ts` 292 (inline `LeadSource`, `SourceMetric`, `SourcesListResult`, `SourceLead`), `activity.ts` 76, `case-study.ts` 48, `dashboard.ts` 18, `sales.ts` 27, `index.ts` 8. Rename → `*-api.ts`.
- `components/` (~40 files): nearly every file declares inline `type Props = {...}` (+ `ActivityItem`, `Metric`, `LeadRow`, `Performer`, `SelectOption`, `StageCount`, `ModalMode`, `ConfirmKind`, `UpdateLeadMut`, `CaseStudyMetric`, `ClientCard`, `MonthPoint`). LARGE-COMP: `client/ClientContactsForm` 159, `lead/LeadPipelineBar` 182. Misplaced: `case-study/shareCaseStudy.ts` (util in components → `lib/`), `client/client-form-styles.ts` + `lead/lead-form-styles.ts` (style consts → co-located `lib/` or keep; log).
- `hooks/`: LARGE-HOOKS: `client/use-clients.ts` 207, `lead/use-leads.ts` 207; rest small (12–90).
- `pages/`: LARGE-PAGES: `lead/LeadsListPage` **502** (!), `client/ClientsListPage` 400, `source/SourcesListPage` 274 (inline `ModalMode`, `ConfirmKind`), `lead/LeadCreatePage` 271, `source/SourceDetailPage` 247, `client/ClientCreatePage` 229; small: lead-detail 163, client-detail 159, case-studies 159, analytics 138, dashboard 102, activity 101.
- `schemas/`: root 5 stub files (`activity.ts`, `case-study.ts`, `client.ts`, `enums.ts` 153 real, `lead.ts` — 2–3 lines) shadowing real nested `schemas/{activity,case-study,client,lead}/*.ts`; flatten to `schema/*.schema.ts`, delete stubs.
- `types/`: 4 one-line stubs (`activity.ts`, `case-study.ts`, `client.ts`, `lead.ts`) vs root `types.ts` 248 — consolidate into `types/*.types.ts`.
- `lib/dashboard-compute.ts` 113 (pure — stays, add barrel); `data/mock-seed.ts` 291.
- Baseline lint: **1 pre-existing error** `react/no-unescaped-entities` in `components/source/SourcesTable.tsx:115` — fix during refactor (`"` → `&quot;`), log.

## Type extraction plan → `types/*.types.ts`

- `types/lead.types.ts`, `types/client.types.ts`, `types/source.types.ts` (LeadSource, SourceMetric, SourcesListResult, SourceLead, ClientContactInput), `types/activity.types.ts`, `types/case-study.types.ts` (CaseStudyMetric), `types/dashboard.types.ts` (Metric, LeadRow, Performer, ClientCard, MonthPoint, StageCount, ActivityItem per area or shared `*_props`).
- All `Props` → `<Component>NameProps` in `types/` (compliant; logged as verbose in ambiguous.md).
- `ModalMode`/`ConfirmKind` (source) → `types/source.types.ts`; `SelectOption`, `UpdateLeadMut` → local types files.
- Root `types.ts` distributed; stub `types/*.ts` replaced.

## Split plan

- `LeadsListPage` 502 → page + `components/lead/leads-table.tsx`, `leads-filters.tsx`, `leads-bulk-bar.tsx` (check existing shared BulkSelectionBar first).
- `ClientsListPage` 400 → same pattern.
- `SourcesListPage` 274, `LeadCreatePage` 271, `SourceDetailPage` 247, `ClientCreatePage` 229 → page + form/table/filter components.
- `LeadPipelineBar` 182 → bar + `lead-pipeline-step.tsx`.
- `use-clients`/`use-leads` 207 → query + filter/mutation slices.
- `api/lead.ts` 455 → `lead-api.ts` + `lead-mutations-api.ts` (or by action group); `client.ts`/`source.ts` similar if mixed.

## Rename / move plan (via `git mv`)

- `schemas/` → `schema/*.schema.ts` (flatten, delete root stubs); `types/` stubs → `*.types.ts`; `api/` → `*-api.ts`; `shareCaseStudy.ts` → `lib/share-case-study.ts`; style consts → `lib/`.
- New barrels everywhere.

## Import fixes (whole repo)

- Root `types` + stub `types/*` importers → new `types/*.types.ts`.
- Schema stub paths → `schema/*`; tests/sales-compute-api.test.ts.
- `shareCaseStudy`, form-styles paths.

## Verification

`npx tsc -b`, `npx eslint src/modules/sales` (must go 1 error → 0), `npx vite build`, `vitest run tests/sales-compute-api.test.ts src/modules/sales`.
