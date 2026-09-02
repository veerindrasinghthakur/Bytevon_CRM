# Module Optimization Report: payroll

**Updated:** 2026-09-02  
**Scope:** Form/type alignment, enums tokens, safeNavigate + payrollRoutes, route typing. No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| `createPayrollRoutes` `any` | `AnyRoute` generic |
| Path helpers | `payslipPath`, `salaryDetailPath`, `historyEmployeePath`, etc. |
| Dashboard hardcoded `/payroll/*` | `safeNavigate` + `payrollRoutes` |
| Dashboard `statusStyles` | `payrollStatusStyles` enums |
| History page path strings | `payrollRoutes.*Path` |
| History status hex/palette | `payrollHistoryStatusStyles` |
| types.ts | Re-exports enums |
| `text-deep-navy` on dashboard/history | `text-on-background` |

---

## Still deferred

- ReviseSalary + RecordPaymentModal full RHF+Zod wire-up (schemas already exist)
- Monthly / Review / Run / Payslip / SalaryDetail residual path audits if any remain
- EmployeePayrollHistory local filters → useListControls
- PayrollHistory local `paidRecords` → list API
- New shared components

---

*Cleared items removed from action lists.*
