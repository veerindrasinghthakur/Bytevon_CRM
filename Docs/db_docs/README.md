# Bytevon DB Docs

This folder contains the **complete final database schema** for Bytevon CRM.

## Files

| File | Description |
|------|-------------|
| [bytevon_final_schema.md](./bytevon_final_schema.md) | Full consolidated schema (all modules, no information loss) |
| [bytevon_schema_visual.html](./bytevon_schema_visual.html) | Colorful interactive visual map of all domains & tables |

## Sources merged

1. Core schema (`final_schema.md`) — Organization, Auth, Employment, RBAC, Leave, Attendance, Approvals, Notifications, Developer, Sales, Audit, Notes & Documents
2. Payroll & Salary (`payroll_doc.md`) — employee_salary, salary items, monthly payroll, payslip flow, attendance lock
3. Task time / progress / breaks / bank / audit archive (`progreesBreak.md`) — task_time_entries, estimated_hours, attendance_breaks, employee_bank_accounts, MinIO audit archive

## Key schema deltas

- `tasks.estimated_hours`
- `task_time_entries` (immutable)
- `attendance_breaks`
- `employee_bank_accounts`
- `monthly_attendance_summaries.is_locked`
- Audit: 10-day PostgreSQL retention → MinIO JSONL permanent archive
