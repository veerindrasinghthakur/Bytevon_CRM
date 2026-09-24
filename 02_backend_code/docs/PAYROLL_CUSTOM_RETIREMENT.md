# Payroll real-data + CUSTOM retirement (testing-worker)

## PRE-CHECK

- `seed_bootstrap.py` SCOPE_SEED: SELF, TEAM, DEPARTMENT, LOCATION, ORGANIZATION only — **no CUSTOM**.
- Live DB should have zero CUSTOM scope rows (gate for enum delete).

## PR-A (payroll contract) — done on testing-worker

| FE path (was) | BE path (now) |
|---------------|---------------|
| GET …/employees/:id/review | GET /payroll/{payroll_id} |
| POST …/employees/:id/approve | POST /payroll/{payroll_id}/approve |
| POST …/employees/:id/pay | POST /payroll/{payroll_id}/pay |
| GET …/employees/:id/payslip | GET /payroll/{payroll_id} |
| GET …/employees/:id/salary | GET /payroll/salaries/current/{eid} |
| PUT …/employees/:id/salary | POST /payroll/salaries |
| GET …/employees/:id | GET /payroll?employment_id= |
| GET …/employees/:id/history | GET /payroll/employees/{eid}/history (**new**) |

Also: list items include `payrollId` / `payroll_id`; status filter on list; period/checks DB-driven; workforce name join on list.

**Mock remains default** (`VITE_USE_MOCK_API` not flipped).

## PR-B (CUSTOM) — partial

- `authorization.py`: CUSTOM early-return removed; string `"CUSTOM"` coerced to `SELF`; `enforce_owner_or_grant` = owner ∪ ≥ DEPARTMENT (`OWNER_OR_GRANT_MIN_RANK`).
- Migrated: payroll salary/bank VIEW, attendance day/list/correction/summary, **policy/current → ORGANIZATION** (security fix).
- Remaining modules (leave, approvals, admin user, workforce employee, assignment, rbac, dashboard) may still pass `"CUSTOM"` — runtime maps to SELF until strings are rewritten.
- `ScopeName.CUSTOM` still in enums until full string sweep + live DB PRE-CHECK; then delete enum + rbac service `"CUSTOM": 0`.

## TODO

1. Bulk replace remaining `"CUSTOM"` route strings with `"SELF"` + ensure second-call `enforce_owner_or_grant`.
2. Delete `ScopeName.CUSTOM` after PRE-CHECK.
3. Payroll seeder for demo monthly rows.
4. Docs resync API_ENDPOINTS.json / API_REFERENCE.md.
5. Flip mock only after FE tour on real `/api/v1/payroll/*` 200s.
