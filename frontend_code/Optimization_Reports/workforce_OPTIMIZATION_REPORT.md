# Module Optimization Report: workforce

**Updated:** 2026-09-02  
**Scope:** Tokens, RHF forms, route helpers. No new components.

---

## Cleared

| Item | Change |
|------|--------|
| EmployeesList stateStyles/stateDot | `employmentStateStyles` / `employmentStateDot` |
| EmployeeDetail edit form | RHF + `employeeDetailEditSchema` |
| EmployeeDetail / list palette | Semantic tokens |
| ShiftCreatePage | RHF + Zod |
| ChangeAssignmentPage | RHF + Zod + shared Select |
| AssignProjectPage | RHF + Zod + shared Select |
| DepartmentCreatePage | RHF + `departmentFormSchema` |
| Route crumbs on assign flow | `workforceRoutes` variables |

---

## Verified / partial

- **EmployeeCreatePage** — schema-aligned `EmploymentFormInput` + transforms; multi-step + UI-only fields — full RHF optional later
- **RouteCrumbs** — path-driven `DynamicRouteCrumbs`; explicit crumbs use `workforceRoutes`

---

## Still deferred

- Attendance pages mock → API list
- EmployeeCreate full multi-step RHF (optional)
- New shared components

---
