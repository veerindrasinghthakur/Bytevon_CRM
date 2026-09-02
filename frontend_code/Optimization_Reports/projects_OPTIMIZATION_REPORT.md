# Module Optimization Report: projects

**Updated:** 2026-09-02  
**Scope:** Tokens, route path helpers, Task/Project detail nav, TasksList controls. No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| cssTokens palette (blue/emerald/amber/violet) | `status-badge` + semantic tokens |
| `projectRoutes` *Path helpers | Added for detail/team/task/notes |
| TaskDetailPage missing `projectRoutes` / `draft` | Import + `form.watch('title')` |
| ProjectDetailPage missing import / hardcoded team path | `projectRoutes` + `safeNavigate` |
| TasksListPage options from wrong module | `TaskStatusOptions` / `TaskPriorityOptions` from `enums` |
| TasksList local filter state | `useTasksList` (+ priority filter) |

---

## Still deferred

- TeamsList / Documents full `useListControls` migration
- Native `<select>` → shared Select on create forms (where residual)
- Consolidate local Metric/Stat to shared MetricCard (no new components this pass)
- Full server-side priority on tasks API if not supported
- New shared components

---
