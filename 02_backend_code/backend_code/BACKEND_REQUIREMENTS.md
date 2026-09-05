# ByteVon CRM Backend — Requirements to Implement Later

Open backend work moved out of day-to-day incompleteness tracking.
Implement these when wiring real services, storage, and frontend contracts.

Source of frontend contracts: `veerindrasinghthakur/bytevon_documentation` → `frontend_code/`.

---

## 1. Still open from core backend build

- [ ] Run `alembic revision --autogenerate -m "initial_schema"` against live PostgreSQL and review migration
- [ ] Rate limiting on login / forgot-password
- [ ] Email delivery for password-reset (Notification EMAIL provider)
- [ ] MinIO client for audit archive + document file storage
- [ ] Payslip PDF generation (Payroll V1 renderer)
- [ ] Super-admin last-remaining protection in RBAC unassign/delete
- [ ] Unit + integration tests
- [ ] Production security headers (HSTS, CSP) beyond CORS middleware

---

## 2. Export API (frontend shared export)

Frontend already calls (real mode):

```http
POST /api/v1/export/{resource}
Content-Type: application/json
Authorization: Bearer <access>
Accept: text/csv | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | application/pdf

{
  "selectedIds": ["..."],
  "filters": { },
  "query": "",
  "sort": { "field": "...", "direction": "asc" } | null,
  "format": "csv" | "xlsx" | "pdf"
}
```

**Response:** binary file body + `Content-Disposition: attachment; filename="..."`

**Rules:**
- Apply auth + RBAC `EXPORT` on the resource (do not trust UI-only gating)
- Rebuild dataset from DB using filters/query/selection (latest data, not client-uploaded rows)
- `resource` examples: `user`, `employment`, `leave_request`, `client`, `lead`, …

---

## 3. Admin settings APIs (frontend migrated)

```http
GET  /api/v1/admin/settings/organization-profile
PATCH /api/v1/admin/settings/organization-profile
# body fields: name, legal, email, phone, website, tax, reg, description

GET  /api/v1/admin/settings/attendance
PATCH /api/v1/admin/settings/attendance
# body fields: shiftStart, shiftEnd, graceMinutes, earlyOutMinutes, otMinMinutes, allowRemoteCheckIn

GET  /api/v1/admin/settings/leave-accrual
PATCH /api/v1/admin/settings/leave-accrual
# body fields: maxCarryOverDays, minimumNoticeDays
```

Align field names with DB when implementing; frontend can adapt DTOs in module API layer.

Existing-related:

```http
GET /api/v1/admin/leave/types
GET /api/v1/admin/leave/policies
GET /api/v1/admin/leave/ledger
GET /api/v1/admin/offices
GET /api/v1/admin/offices/head-options
```

---

## 4. Schema / docs sync

- Document `logins.failed_attempt_count`, `locked_until`, `is_active` in schema markdown
- Document `password_reset_tokens` table in schema markdown
- Keep `SYSTEM_EMPLOYMENT_ID` (no `actor_type`)

---

## 5. Implementation notes

1. Prefer Public Service + repository; no business logic in routes.
2. Notifications + audit only after successful commit.
3. Export and settings mutations must be audited.
4. When frontend `VITE_USE_MOCK_API=false`, these paths must exist or the UI export/settings flows fail.

See also: `INCOMPLETENESS.md` (status of what was already implemented in `backend_code/`).
