# Module Optimization Report: projects

**Updated:** 2026-09-02  
**Scope complete for form/type/token/list-control pass. No new components.**

---

## Cleared

| Item | Change |
|------|--------|
| cssTokens palette | `status-badge` + semantic tokens |
| `projectRoutes` *Path helpers | Pages use path variables |
| TaskDetail / ProjectDetail nav | `safeNavigate` + route vars |
| TasksListPage / TeamsListPage | `useTasksList` / `useTeamsList` |
| DocumentsPage | ListToolbar + useListControls |
| ProjectCreatePage | shared Select |
| Local Metric/Stat | → shared `MetricCard` on Projects list |
| Hardcoded `$12.4M` budget KPI | → completion-rate MetricCard from filtered metrics |
| CreateTaskModal / CreateTeamModal | Already RHF + Zod |

---

## Still deferred

- New shared components only if product asks
- Server-side budget totals when API exposes them

---
