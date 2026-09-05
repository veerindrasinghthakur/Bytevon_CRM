# Bytevon CRM — Complete Final Database Schema

> Single consolidated reference from **final_schema.md**, **payroll_doc.md**, and **progreesBreak.md**.
> Visual map: [bytevon_schema_visual.html](./bytevon_schema_visual.html)

---

## Legend

| Symbol | Meaning |
|--------|--------|
| 🟩 | Append-only (never UPDATE / DELETE) |
| 🟦 | Versioned (`effective_from` / `effective_to`) |
| 🟨 | Admin-managed |
| 🟪 | Seeded |

**Conventions:** INT AUTO_INCREMENT PK · integer FKs · archive not hard-delete · system actions use reserved system employment id (actor_type simplified).

---

## Schema deltas (extensions beyond core)

| Change | Detail |
|--------|--------|
| `tasks.estimated_hours` | DECIMAL(6,2) OPTIONAL |
| `task_time_entries` | New 🟩 immutable table |
| `attendance_breaks` | New table on attendance_days |
| `employee_bank_accounts` | New 🟨 bank accounts for salary |
| `monthly_attendance_summaries.is_locked` | BOOLEAN — TRUE after payroll PAID |
| Audit archive | 10-day PG retention → MinIO JSONL; unified Audit Service |

---

## 1. Organization

### departments 🟨🟦
`id, name, department_head_employment_id→employments, is_archived, created_at, created_by`

### working_weeks 🟦
`id, name, working_days_of_week SMALLINT[], effective_from, effective_to, created_at, created_by`

### shifts 🟨
`id, name, start_time, end_time, is_overnight, grace_late_minutes, flexible_end, break_duration_minutes, is_archived, created_at, updated_at, changed_by`

### holiday_calendars 🟨
`id, name, is_archived, created_at, updated_at, changed_by`

### holidays 🟩
`id, holiday_calendar_id, name, date, holiday_type (NATIONAL|REGIONAL|OPTIONAL|COMPANY), recurring_flag, created_at, changed_by`

### locations 🟨
`id, name, timezone, working_week_id, holiday_calendar_id, latitude, longitude, attendance_radius_meters, allowed_ip_cidrs TEXT[], country, state, city, address, payroll_region, currency, fiscal_year_start_month, is_archived, created_at, updated_at, changed_by`

### organization_settings 🟨 (singleton)
`id, company_name, head_office_location_id, default_timezone, default_currency, logo_reference, created_at, updated_at, changed_by`

---

## 2. Authentication

### persons 🟨
`id, first_name, last_name, date_of_birth, personal_email, personal_phone, address, is_anonymized, anonymized_at, created_at, updated_at`

### logins 🟨
`id, person_id UNIQUE, email UNIQUE, password_hash, created_at`

### sessions 🟩
`id, login_id, refresh_token_hash, device_name, device_type (DESKTOP|MOBILE|TABLET|OTHER), ip_address, user_agent, status (ACTIVE|REVOKED|EXPIRED), revoked_reason, last_used_at, expires_at, revoked_at, created_at`

---

## 3. Employment

### employments 🟨
`id, person_id, employee_code UNIQUE, employment_type (FULL_TIME|PART_TIME|INTERN|CONTRACTOR|CONSULTANT), current_state, joining_date, created_at, updated_at, changed_by`

**EmploymentState:** ONBOARDING | PROBATION | CONFIRMED | SERVING_NOTICE | RESIGNED | TERMINATED | ALUMNI

### employment_state_history 🟩
`id, employment_id, previous_state, new_state, effective_date, reason, created_at, changed_by`

### employment_assignments 🟩
`id, employment_id, department_id, position_id, location_id, shift_id, work_mode (OFFICE|WFH), effective_from, effective_to, change_reason, created_at, changed_by`  
Current assignment: `effective_to IS NULL`

### positions 🟨
`id, name, is_archived, created_at, updated_at`

---

## 4. RBAC

**Action:** VIEW | CREATE | UPDATE | DELETE | APPROVE | EXPORT

### resources 🟪 · permissions 🟪 · scopes 🟪
Scopes seed: SELF, TEAM, DEPARTMENT, LOCATION, ORGANIZATION, CUSTOM

### roles 🟨
`id, name UNIQUE, description, is_system_role, created_at, changed_by`

### role_permissions 🟨
PK `(role_id, permission_id, scope_id)`

### employee_roles 🟨
PK `(employment_id, role_id)`, `assigned_at, changed_by`

### sensitive_fields 🟪 · role_sensitive_field_permissions 🟨
`can_read, can_update`

---

## 5. Leave

**LeaveType:** CASUAL | SICK | EARNED | MATERNITY | PATERNITY | LOSS_OF_PAY | COMP_OFF  
**LeaveRequestStatus:** PENDING | APPROVED | REJECTED | CANCELLED

### leave_policies 🟦
`id, name, leave_type, annual_entitlement, carry_forward_limit, effective_from, effective_to, created_at, changed_by`

### leave_requests 🟨
`id, employment_id, leave_type, start_date, end_date, reason, approval_request_id, status, created_at, updated_at`

### leave_ledger 🟩
`id, employment_id, leave_type, transaction_type, days, reference_type, reference_id, created_at, changed_by`  
Balance = SUM(ledger) — never a mutable balance column

---

## 6. Attendance

**AttendanceStatus:** PRESENT | ABSENT | HALF_DAY | HOLIDAY | WEEK_OFF | ON_LEAVE  
**PunchType:** CHECK_IN | CHECK_OUT

### attendance_days 🟨
`id, employment_id, shift_id, attendance_date, status, working_hours, created_at, updated_at`

### attendance_punches 🟩
`id, attendance_day_id, punch_type, punch_time, latitude, longitude, accuracy_meters, client_ip, is_valid_punch, validation_message, created_at`

### attendance_corrections 🟨
`id, attendance_day_id, requested_check_in, requested_check_out, reason, approval_request_id, status (PENDING|APPROVED|REJECTED), created_at, updated_at`

### monthly_attendance_summaries 🟩 (cache)
`id, employment_id, year, month, present_days, absent_days, half_days, holiday_days, week_off_days, on_leave_days, working_hours, overtime_hours, late_count, early_departure_count, attendance_percentage, rebuilt_at, created_at, updated_at, changed_by, **is_locked**`  
Rebuildable only when `is_locked = FALSE` and payroll not PAID

### attendance_policies 🟦
`id, name, correction_window_days, max_corrections_per_month, reasons_mandatory, approval_sla_hours, allow_multiple_punches, require_checkout_before_new_checkin, auto_create_attendance_day, default_grace_late_minutes, max_clock_drift_seconds, effective_from, effective_to, created_at, changed_by`

### attendance_breaks (new)
`id, attendance_day_id, break_start, break_end, duration_minutes, created_at`  
INDEX(attendance_day_id), INDEX(break_start)

---

## 7. Approvals

### approval_requests 🟨
`id, request_type, reference_id, requester_employment_id, target (DEPARTMENT_HEAD|DEPARTMENT), target_department_id, status (PENDING|APPROVED|REJECTED|CANCELLED), created_at, updated_at`

### approval_actions 🟩
`id, approval_request_id, employment_id, action (APPROVED|REJECTED|COMMENTED|FORWARDED), remarks, created_at`

Consumer owns local status projection. Approval module only writes these two tables. Notifications after commit.

---

## 8. Notifications

### notification_templates · notifications · notification_preferences 🟨
V1 channels: **IN_APP** (+ EMAIL optional). Preferences PK `(employment_id, channel)`.

---

## 9. Developer / Projects

### teams 🟨 · team_members 🟩
Team head · membership history with `joined_at` / `left_at` · team_role independent of position

### projects 🟨
`id, client_id, lead_id UNIQUE, project_name, description, assignment_type (INDIVIDUAL|TEAM), assigned_to_id, repository_reference, status, phase, created_from (LEAD|MANUAL), planned/actual dates, created_at, updated_at, changed_by`

**ProjectStatus:** PLANNED | ACTIVE | ON_HOLD | COMPLETED | CANCELLED | ARCHIVED  
**ProjectPhase:** INITIAL → … → CLOSED

### tasks 🟨 (+ estimated_hours)
`id, project_id, title, description, assignee_employment_id, priority, status, start_date, due_date, **estimated_hours**, completed_at, commit_reference, created_at, updated_at, changed_by`

**TaskPriority:** LOW | MEDIUM | HIGH | CRITICAL  
**TaskStatus:** TODO | IN_PROGRESS | IN_REVIEW | COMPLETED | BLOCKED | CANCELLED

### task_time_entries 🟩 (new, immutable)
```
id, task_id, employment_id, work_date, duration_minutes (>0),
description, created_at
UNIQUE(task_id, employment_id, work_date)
```
- Only current assignee may create entries
- actual_minutes = SUM(duration_minutes); progress% from estimated_hours (display capped 100%)
- No daily_progress table — derived from entries + attendance

---

## 10. Sales

### clients 🟨 · client_contacts 🟨 · platforms 🟨 · leads 🟨
**ClientType:** INDIVIDUAL | COMPANY  
Lead WON → resolve/create client → auto project (one lead → one project UNIQUE)

---

## 11. Audit

### audit_logs 🟩
`id, reference_type, reference_id, action, description, employment_id NULLABLE, ip_address, user_agent, created_at`

**AuditAction:** CREATE | UPDATE | ARCHIVE | RESTORE | LOGIN | LOGOUT | PASSWORD_CHANGE | APPROVE | REJECT | ASSIGN | UNASSIGN | STATUS_CHANGE | EXPORT  
**AuditReferenceType:** EMPLOYMENT | LOGIN | ROLE | PERMISSION | DEPARTMENT | LOCATION | LEAVE_REQUEST | ATTENDANCE | ATTENDANCE_CORRECTION | APPROVAL_REQUEST | CLIENT | LEAD | PROJECT | TASK | TEAM | NOTE | DOCUMENT | NOTIFICATION | ORGANIZATION | SYSTEM

### Archive lifecycle
```
Event → PostgreSQL audit_logs (10 days)
      → Archive worker → date-based JSONL → MinIO (permanent)
      → Delete PG rows only after successful upload
```
Unified Audit Service merges PG + MinIO. No archive table / no `is_archived` column. Never restore archives to PG.

---

## 12. Notes & Documents

### notes 🟨
`reference_type (LEAD|PROJECT|TASK|CLIENT) + reference_id, title, content`

### document_types 🟨 · documents 🟨 · document_versions 🟩 · document_links 🟩
External file storage; version chain; multi-entity links via DocumentLinkType.

---

## 13. Payroll & Salary

### employee_salary 🟦
`id, employment_id, effective_from, effective_to, gross_salary, created_at, updated_at, changed_by`  
Revisions create new rows; no overlap for same employment

### employee_salary_items
`id, employee_salary_id, name, type (EARNING|DEDUCTION), amount, created_at, updated_at, changed_by`  
Fixed amounts only in V1 (no formulas/percentages)

### monthly_payroll
`id, employment_id, year, month, gross_salary, total_earnings, total_deductions, net_salary, status (CALCULATED|APPROVED|PAID), payment_method, payment_reference, payment_date, created_at, updated_at, changed_by`  
UNIQUE(employment_id, year, month)

### monthly_payroll_items
`id, monthly_payroll_id, name, type (EARNING|DEDUCTION|ADJUSTMENT), amount, description`  
Snapshot at calculation time; later salary changes do not rewrite history

### employee_bank_accounts 🟨 (new)
`id, employment_id, account_holder_name, bank_name, account_number, ifsc_code, account_type, is_primary, is_active, created_at, updated_at, changed_by`  
One active primary per employment

### Payroll flow
```
Salary config + Attendance summary
  → generate_monthly_payroll (CALCULATED)
  → approve_monthly_payroll (APPROVED)
  → record_payroll_payment (PAID + payment fields)
  → generate_payslip PDF
  → monthly_attendance_summaries.is_locked = TRUE
```
Post-pay corrections → next month **ADJUSTMENT** item only.

---

## Locked cross-cutting decisions

1. Public service owns transactions; notifications & audit after commit.
2. Append-only history tables never updated/deleted.
3. Versioned config uses effective dating, never overwrite.
4. Archive entities instead of hard delete.
5. Polymorphic refs: type + integer id; validate in owning service.
6. One lead → one project (UNIQUE lead_id).
7. Client created on Lead WON (reuse if exists).
8. Approval writes only approval_requests + approval_actions.
9. Payslip is PDF artifact, not a table.
10. Audit: significant events only; no field-level diffs in V1; 10-day PG → MinIO archive.

---

*Open [bytevon_schema_visual.html](./bytevon_schema_visual.html) for the colorful interactive domain map.*
