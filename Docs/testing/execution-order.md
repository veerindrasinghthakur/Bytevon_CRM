# Execution Order (FINAL — Corrected)

## Phase order (binding)

```text
PHASE 0: TASK-000 → TASK-001 → TASK-002 → TASK-003 → TASK-SEC-MAP-001
PHASE 0.25: SA-01 → SA-02 → SA-03 → SA-04 → SA-05 → SA-06 (all must PASS)
PHASE 0.5: SG-01 → SG-02 (DG-01..DG-09 diagnostics) → SG-03 → SEC-001..008 → SG-05 re-verify → GATE PASS
PHASE 1: TASK-010..017 (blocked until static-analysis PASS)
PHASE 2: Authentication (blocked until SEC-001..004 PASS for tests depending on contracts)
PHASE 3: Permanent Authorization/RBAC Regression (blocked until security gate PASS)
PHASE 4: Module tests, sequential (blocked until security gate PASS)
PHASE 5: Workflows (after respective modules)
PHASE 6: Negative/security (after modules)
PHASE 7: Regression/coverage (after all)
PHASE 8: Final verification
```

## Gate rules (worker code and this document are identical)

```python
if task.phase >= "PHASE_1" and not static_analysis_gate_passed(): BLOCKED
if task.phase in ("PHASE_2","PHASE_3") and not security_gate_passed():
    BLOCKED unless task.is_security_gate_or_remediation_task
if task.phase >= "PHASE_4" and not security_gate_passed(): BLOCKED
```

- Static-analysis failure blocks everything from Phase 1 onward.
- Security-gate failure blocks Phase 2+ application testing except explicit SG/SEC/mapping tasks.
- Broad protected-endpoint testing (Phase 4+) requires security gate PASS.

## Key dependency chains

```text
TASK-000 → TASK-001 → TASK-SEC-MAP-001 → SEC-002, SEC-004
TASK-001 → endpoint_inventory.json → all coverage denominators
SEC-001..004 → SG-05 re-verify → security_gate_passed() → PHASE 4+
TASK-011 → TASK-012 → TASK-017 (cleanup verification)
```

## Parallelization

SERIAL ONLY for all DB-touching phases (shared truncate strategy).
No pytest-xdist. Module tests run sequentially. Negative tests run sequentially.
Flaky rerun: max 3x with evidence, then classify (do not loop blindly).

## Coverage reporting

All coverage denominators come from `endpoint_inventory.json`:
`covered_endpoints / TOTAL_ENDPOINTS`, `protected_endpoints_with_authz_coverage / PROTECTED_ENDPOINTS`,
`write_endpoints_with_db_verification / WRITE_ENDPOINTS`.
Targets: 100% of discovered inventory (not a hardcoded number, not 30%).
