# Module Optimization Report: projects

**Updated:** 2026-09-02  
**Scope:** Tokens, list controls, route path helpers, types/enums. No new components.

---

## Cleared

| Item | Change |
|------|--------|
| cssTokens palette | `status-badge` + semantic tokens |
| `projectRoutes` *Path helpers | Pages use path variables |
| TaskDetail / ProjectDetail nav | `safeNavigate` + route vars |
| TasksListPage | `useTasksList` + enums options |
| TeamsListPage list controls | `useTeamsList` + server filters |
| TeamsList / ProjectsList palette | secondary / status tokens |
| ProjectCreatePage | shared `Select`; focus rings secondary |
| DocumentsPage | `ProjectDocument`; ErrorState/EmptyState; **ListToolbar + useListControls** |
| types.ts | Task/Team status+priority from `enums` |

---

## Still deferred

- Consolidate local Metric/Stat to shared MetricCard (no new components this pass)
- Team/Task create residual RHF polish
- Hardcoded budget KPI on Projects list
- New shared components

---
