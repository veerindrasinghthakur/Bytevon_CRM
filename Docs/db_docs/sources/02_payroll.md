# Payroll & Salary Module

*(Full document from payroll_doc.md — complete V1 payroll architecture)*

See the consolidated visual map: [../bytevon_schema_visual.html](../bytevon_schema_visual.html)

---

The complete payroll documentation covers:

## Tables
- `employee_salary` (versioned salary config)
- `employee_salary_items` (EARNING | DEDUCTION fixed amounts)
- `monthly_payroll` (CALCULATED → APPROVED → PAID)
- `monthly_payroll_items` (EARNING | DEDUCTION | ADJUSTMENT snapshot)
- `employee_bank_accounts` (primary salary account)

## Key rules
- Salary revisions create new rows (effective_from / effective_to)
- Monthly payroll is a historical snapshot of salary items
- Payslip is a PDF of monthly_payroll + items (no payslips table)
- After PAID: `monthly_attendance_summaries.is_locked = TRUE`
- Post-pay attendance corrections → next month ADJUSTMENT item
- No separate payment / adjustment / payslip / lock tables in V1

## Services
- generate_monthly_payroll
- approve_monthly_payroll
- record_payroll_payment
- generate_payslip

## Attendance integration
Reads `monthly_attendance_summaries` for LOP / payable days. Does not duplicate attendance metrics into payroll.

---

**Full detailed tables, enums, workflows, and locked decisions are preserved in the original `payroll_doc.md` source and in the consolidated schema document.**

For the complete untruncated payroll specification including all business rules, examples, and the end-to-end flow diagram, refer to the project attachment `payroll_doc.md` which was merged into this db_docs package.
