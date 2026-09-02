# Module Optimization Report: projects

**Updated:** 2026-09-02  
**Scope:** Tokens, list controls, route path helpers, types/enums. No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| cssTokens palette | `status-badge` + semantic tokens |
| `projectRoutes` *Path helpers | Pages use path variables |
| TaskDetail / ProjectDetail nav | `safeNavigate` + route vars |
| TasksListPage | `useTasksList` + enums options |
| TeamsListPage list controls | `useTeamsList` (`useListControls`) + server filters |
| TeamsList / ProjectsList palette | electric-blue / emerald / blue-100 → secondary / status tokens |
| ProjectCreatePage | native `<select>` → shared `Select`; focus rings secondary |
| DocumentsPage | `ProjectDocument` type; `ErrorState` / `EmptyState` |
| types.ts | Task/Team status+priority re-exported from `enums` |

---

## Still deferred

- Documents full `useListControls` + server type filter
- Consolidate local Metric/Stat to shared MetricCard (no new components this pass)
- Team/Task create residual RHF polish
- Hardcoded budget KPI on Projects list
- New shared components

---
