# Bytevon Final Schema — Index

## Canonical files in this folder

| Path | Content |
|------|--------|
| [bytevon_schema_visual.html](./bytevon_schema_visual.html) | Colorful domain/table visual map |
| [README.md](./README.md) | Overview |
| [sources/01_final_schema.md](./sources/01_final_schema.md) | Core schema (org, auth, employment, RBAC, leave, attendance, approvals, notifications, developer, sales, audit, notes/docs) |
| [sources/02_payroll.md](./sources/02_payroll.md) | Payroll & Salary module |
| [sources/03_progress_breaks_bank_audit.md](./sources/03_progress_breaks_bank_audit.md) | Task time tracking, daily progress, attendance_breaks, employee_bank_accounts, audit archive |

## Schema deltas (extensions)

1. **tasks.estimated_hours** — DECIMAL(6,2) OPTIONAL
2. **task_time_entries** — immutable daily work records (UNIQUE task+employment+work_date)
3. **attendance_breaks** — break_start / break_end / duration_minutes
4. **employee_bank_accounts** — salary payment accounts (one active primary)
5. **monthly_attendance_summaries.is_locked** — set TRUE after payroll PAID
6. **Audit archive** — 10-day PostgreSQL retention → MinIO JSONL permanent archive; unified Audit Service

## Classification legend

- 🟩 Append-only (never UPDATE/DELETE)
- 🟦 Versioned (`effective_from` / `effective_to`)
- 🟨 Admin-managed
- 🟪 Seeded

Open **bytevon_schema_visual.html** in a browser for the full visual map of all domains and tables.
