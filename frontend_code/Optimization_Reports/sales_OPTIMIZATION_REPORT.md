# Module Optimization Report: sales

**Updated:** 2026-09-02  
**Scope:** Tokens, route helpers, form/type alignment. No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| Palette stage/priority/type/activity styles in cssTokens | → `status-badge` + semantic tokens |
| Emoji activity icons | → material symbol names |
| `createSalesRoutes` `any` | `AnyRoute` generic |
| Path templates | `leadDetailPath`, `clientDetailPath`, edit paths |
| Dashboard/Analytics emerald/red change chips | `changeTypeStyles` |
| Dashboard nav to detail | `*Path` + params |
| Lead/Client create forms | Already RHF + Zod (prior) |
| Activity / Analytics hooks | Already on `useSalesActivities` / `useSalesDashboardMetrics` |

---

## Still deferred

- CaseStudies Edit/Share button handlers
- Orphan `LeadFiltersBar` removal
- use-sales cache helper typing polish
- New shared components

---

*Cleared items removed from action lists.*
