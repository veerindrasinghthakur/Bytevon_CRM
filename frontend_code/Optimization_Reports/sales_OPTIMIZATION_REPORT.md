# Module Optimization Report: sales

**Updated:** 2026-09-02

---

## Cleared this pass

| Item | Change |
|------|--------|
| `use-sales` hardcoded keys / weak optimistic types | `hooks/sales-cache.ts` + `queryKeys.sales.*` only; `mergeLead`/`mergeClient` |
| `use-sales-dashboard` local compute | `lib/dashboard-compute.ts` pure helpers |
| `use-case-studies-list` client filter, no page | `listCaseStudies` server filter+page; list hook + Pagination UI |

---

## Still deferred

- Dedicated case-study create/edit route
- New shared components

---
