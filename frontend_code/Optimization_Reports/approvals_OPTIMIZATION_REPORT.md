# Module Optimization Report: approvals

**Updated:** 2026-09-02  
**Scope this pass:** Form & type, page refactoring with **existing** shared components/hooks, `safeNavigate` + route variables, CSS tokens.  
**Constraint:** No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| Hardcoded navigate paths | `approvalRoutes` helpers + `safeNavigate` on all pages |
| Tailwind palette colors (red/emerald/amber/blue/slate) | `status-badge` + semantic tokens / CSS variables |
| ApprovalCenter priority `Record<string,string>` | `Record<ApprovalPriority, string>` + status tokens |
| PendingApprovals inline KPI tiles | shared `MetricCard` |
| PendingApprovals `priorityDot` palette | semantic / CSS-var dots |
| ApprovalDetail manual comment/action state | already RHF+Zod; fixed submit via `setValue` + `handleSubmit`; data from `usePendingApprovals` |
| ApprovalDetail mock import | removed |
| MyRequests status palette classes | `status-badge` + token dots |
| MyRequests filter `useState` / mock | uses `useMyRequests` (`useListControls` + queryKeys) |
| Hooks hardcoded query keys | already `queryKeys.approvals.*` |

---

## Still deferred

- Wire Approval Center filter Selects to list controls / API
- Real pagination on center + my-requests
- Metrics/`types` from API response instead of client slice/Set
- Approve/reject/revision mutations on detail
- Product decision on MyRequests ownership (approvals vs my-work)
- New shared components (none this pass)

---

*Cleared items removed from action lists.*
