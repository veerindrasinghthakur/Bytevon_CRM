# Module Optimization Report: payroll

**Updated:** 2026-09-02  
**Scope:** Nav sweep + status tokens. No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| MonthlyPayroll hardcoded `/payroll/*` | `safeNavigate` + `payrollRoutes` |
| Monthly local `statusBadge` palette | `payrollStatusStyles` |
| RunPayroll hardcoded navigate | `payrollRoutes` |
| Review / Payslip / Salary / SalaryDetail residual paths | path helpers + tokens (partial in same batch for Monthly/Run) |

---

## Still deferred

- ReviseSalary full RHF+Zod (`salaryFormSchema`)
- RecordPaymentModal RHF
- History org list API-backed
- New shared components

---

*Cleared nav/token items removed from action lists.*
