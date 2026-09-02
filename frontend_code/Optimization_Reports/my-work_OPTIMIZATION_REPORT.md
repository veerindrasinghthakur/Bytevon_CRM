# Module Optimization Report: my-work

**Updated:** 2026-09-02  
**Scope this pass:** Form/type, enums tokens, detail pages off mock, safeNavigate variables, attendance hook queries.  
**Constraint:** No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| Local `statusStyles` on Attendance/Leave/Approval detail | → `schemas/enums` (`attendanceStatusStyles` / `statusStyles`) |
| Palette colors in enums | → `status-badge` + semantic / CSS-var tokens |
| Detail pages direct `data/mock` imports | → `listMyAttendance` / `listMyApprovals` / overview via Query |
| MyApprovalDetail hardcoded `/my-work/*` paths | → `myWorkRoutes` + `safeNavigate` |
| ManualAttendanceForm `navigate({ to: '...' })` | → `safeNavigate` + `myWorkRoutes.attendance` |
| Manual reasons array | → `MANUAL_ATTENDANCE_REASONS` in enums |
| useMyAttendance missing today/week | → `todayInfo` + `weekHours` queries on hook |
| types.ts | Re-exports enums maps |

---

## Still deferred

- New shared components (StatCard, WeekBar, StatusBadge wrapper, FormField, Calendar, etc.)
- Full RHF on ManualAttendanceForm / TakeABreak / corrections modal (schemas exist for correction; wire later)
- ApplyLeave calendar extraction / LeaveCalendarTab mock import
- MyRequests inline StatCard → MetricCard (optional reuse pass)
- Delete thin `data/mock.ts` re-export (after all consumers gone)
- LeaveDetailPage still uses mock for leave request until dedicated getLeave API — partial: prefer list API in a follow-up

---

*Cleared items removed from action lists.*
