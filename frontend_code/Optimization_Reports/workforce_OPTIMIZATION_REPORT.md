# Module Optimization Report: workforce

**Updated:** 2026-09-02  
**Scope this pass:** Employment state tokens, EmployeeDetail RHF+Zod, list/detail palette, ShiftCreate RHF. No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| EmployeesList local `stateStyles` / `stateDot` | → `employmentStateStyles` / `employmentStateDot` in `schemas/enums.ts` |
| Login column emerald/amber | → `loginEnabledClass` / `loginDisabledClass` |
| EmployeeDetail manual useState edit form | → RHF + `employeeDetailEditSchema` |
| EmployeeDetail palette (emerald/amber) | → semantic tokens / status styles |
| EmployeeDetail hardcoded `/workforce/employees` | → `workforceRoutes.employees` + `safeNavigate` |
| EmployeesList goDetail | → `employeeDetailPath` |
| ShiftCreatePage | RHF + Zod; `safeNavigate` to shifts list |
| types.ts | Re-exports employment state enums + detail edit schema |

---

## Verified (schema-aligned forms; full RHF optional later)

- **EmployeeCreatePage** — `EmploymentFormInput` + `toCreateEmploymentInput`; shared Select; not full RHF (multi-step + UI-only fields)
- **DepartmentCreatePage** — `DepartmentFormInput` + `toCreateDepartmentInput`; schema-aligned useState

---

## Still deferred

- Attendance pages still seed from mock (API list later)
- ChangeAssignment / AssignProject full RHF+Zod
- EmployeeCreate / DepartmentCreate full RHF migration
- RouteCrumbs hardcoded path audit
- New shared components

---

*Cleared items removed from action lists.*
