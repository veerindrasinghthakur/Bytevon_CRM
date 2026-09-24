# Payroll real-data + CUSTOM retirement (testing-worker)

## PRE-CHECK

- `seed_bootstrap.py` SCOPE_SEED: SELF, TEAM, DEPARTMENT, LOCATION, ORGANIZATION only — **no CUSTOM**.
- Live DB should have zero CUSTOM scope rows (gate for enum delete).

## PR-A (payroll contract) — done

FE paths rewired to payroll_id / salaries/current / POST salaries / employment history.
List includes `payrollId`; period/checks DB-driven; status filter; workforce name join.
**Mock not flipped.**

## PR-B (CUSTOM) — route migration done

All former `require_permission(..., "CUSTOM")` sites → **`"SELF"` + `enforce_owner_or_grant`** (owner ∪ ≥ DEPARTMENT):

| Module | Files |
|--------|--------|
| Payroll | salary_management, employee_payroll (bank) |
| Attendance | routes (day/list/correction/summary); **policy/current → ORGANIZATION** |
| Leave | request, ledger |
| Approvals | request detail, cancel/comment |
| Admin user | get/patch/delete |
| Workforce employee | person/employment; positions grant-only preserved |
| Assignment | state-history, assignments |
| RBAC | effective-permissions |

`authorization.py`:
- No CUSTOM early-return
- String `"CUSTOM"` coerced to SELF (compat)
- `OWNER_OR_GRANT_MIN_RANK` = DEPARTMENT

`rbac/service.py` SCOPE_RANK: **CUSTOM key removed**.

### Still optional

- Delete `ScopeName.CUSTOM` from `enums.py` after live DB confirms zero CUSTOM scope rows (safe; seeds never used it).
- Payroll demo seeder
- API_ENDPOINTS.json / API_REFERENCE.md resync
- Flip `VITE_USE_MOCK_API` only after FE tour on real `/api/v1/payroll/*` 200s
