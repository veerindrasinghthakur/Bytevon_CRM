# Module Optimization Report: sales

**Updated:** 2026-09-02

---

## Cleared

| Item | Change |
|------|--------|
| `use-sales` hardcoded keys / weak optimistic types | `hooks/sales-cache.ts` + `queryKeys.sales.*` only; `mergeLead`/`mergeClient` (no `any`) |
| `use-sales-dashboard` local compute / hardcodes | `lib/dashboard-compute.ts` pure helpers; `PipelineStageValues` + `typeIcon` from schemas |
| `use-case-studies-list` client filter, no page | `listCaseStudies` server filter+page; list hook passes params; Pagination + `pageSize` on page |
| LeadsList status dot palette | `bg-emerald-500`/`bg-slate-400` → `bg-secondary`/`bg-outline` |

---

## Still deferred

- Dedicated case-study create/edit route
- New shared components
