# Module Optimization Report: workforce

**Updated:** 2026-09-02  
**Scope this pass:** Form/type alignment, enums tokens, safeNavigate + workforceRoutes path helpers. No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| Missing enums file | `schemas/enums.ts` — attendance / employee / department status |
| `createWorkforceRoutes` `any` | `AnyRoute` generic |
| Path templates for `$params` | `employeeDetailPath`, `teamDetailPath`, `attendanceRecordPath`, etc. |
| AttendanceDashboard palette statusClass | → `workforceAttendanceStatusStyles` |
| AttendanceDashboard hardcoded `$attendanceId` path | → `workforceRoutes.attendanceRecordPath` |
| Corrections pending amber palette | → `status-badge status-warning` |
| WorkforceAttendanceDetail palette + showBack | → enums + `BackButton` |
| AssignProject hardcoded paths / crumbs | → `workforceRoutes` |
| ChangeAssignment `navigate` hardcode | → `safeNavigate` + path helper |
| types.ts | Re-exports enums |

---

## Still deferred

- Attendance pages still seed from `@/shared/mock/data/workforce` (API list later)
- ChangeAssignment / AssignProject full RHF+Zod
- Residual hardcoded paths on other team/employee pages if any remain
- New shared components
- RouteCrumbs hardcoded path audit

---

*Cleared items removed from action lists.*
