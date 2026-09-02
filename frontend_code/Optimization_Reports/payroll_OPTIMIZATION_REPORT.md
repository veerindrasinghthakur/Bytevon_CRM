# Module Optimization Report: payroll

**Updated:** 2026-09-02

---

## Cleared

| Item | Change |
|------|--------|
| Nav + status tokens | Prior |
| Org History API | `listOrgPayrollHistory` + query on History page |
| ReviseSalary RHF | `salaryFormSchema` + `useFieldArray` + `toSaveSalaryInput` |
| useReviseSalary | Accepts `SaveSalaryStructureInput` |

---

## Still deferred

- RecordPaymentModal full RHF (paymentRef still local state; functional)
- New shared components

---
