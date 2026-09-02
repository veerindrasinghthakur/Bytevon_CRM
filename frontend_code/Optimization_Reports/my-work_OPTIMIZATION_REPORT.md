# Module Optimization Report: my-work

**Updated:** 2026-09-02  
**Scope this pass:** Form/type, enums tokens, detail pages off mock, safeNavigate variables.  
**Constraint:** No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| Local `statusStyles` on Attendance/Leave/Approval detail | → `schemas/enums` |
| LeaveDetailPage local palette statusStyles | → `statusStyles` enums |
| LeaveDetailPage `data/mock` imports | → `listMyLeaveRequests` / balances / overview Query |
| LeaveDetailPage PageHeader showBack | → `BackButton` + `myWorkRoutes.leave` |
| Detail pages direct mock | Attendance / Approval / Leave all API-backed |
| types.ts | Re-exports enums maps |

---

## Still deferred

- New shared components (StatCard, WeekBar, StatusBadge wrapper, FormField, Calendar, etc.)
- Full RHF on ManualAttendanceForm / TakeABreak / corrections modal
- ApplyLeave calendar extraction / LeaveCalendarTab mock import
- MyRequests inline StatCard → MetricCard (optional)
- Delete thin `data/mock.ts` re-export (after all consumers gone)

---

*Cleared items removed from action lists.*
