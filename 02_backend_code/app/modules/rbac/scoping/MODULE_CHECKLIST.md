# RBAC data-scope pattern (Phases 2–4)

Apply this for every additional rbac-covered module **as it is built or revisited**:
Sales, Attendance, Developer/Projects, Manager, Audit/export, etc.

Do **not** invent a generic auto-adapter. FK paths differ per resource
(e.g. Team has no `department_id`; Location is first-class, not derived
from department).

## Checklist per resource

1. **ScopeAdapter** (`rbac/scoping/adapters.py`)
   - Explicit class for this resource’s own join/FK path.
   - Register in `SCOPE_ADAPTERS[resources.name]`.
   - Union OR semantics when multiple scope dimensions apply.
   - `organization_wide` → no extra WHERE.

2. **CRUD enforcement**
   - List/search/count: `ScopeResolver.resolve(actor, resource, "VIEW")` then
     `apply_scope` **before** pagination/filters.
   - Detail/update/delete: `id = :id AND <scope predicate>` (never fetch-then-check).
   - Create: `scope_for_create` + `validate_create_payload` → **403** if FK outside allowed set (never silent overwrite).
   - Route dependency: `require_permission(resource, action, "ANY")` (or equivalent) so **no grant → 403**.

3. **Sensitive fields** (Phase 4)
   - Every response builder and **every export path** for the resource calls
     `rbac.serialization.filter_response` (same function — no export-only filter).

4. **RelationshipPolicy** (when action needs more than scope)
   - Register in `RELATIONSHIP_POLICIES[(resource, action)]`.
   - Fail → **403** (record not hidden).

5. **Status codes**
   - **403**: no grant; relationship/policy denial; sensitive-field denial.
   - **404**: grant exists; target missing or out of scope (identical).

## Reference implementations

| Resource | Adapter | Scoped CRUD | Sensitive filter |
|----------|---------|-------------|------------------|
| `employment` | `EmployeeScopeAdapter` | `workforce/employee/scoped_ops.py` | via `filter_response` |
| `leave_request` | `LeaveScopeAdapter` | `leave/request/scoped_ops.py` | (add when fields seeded) |
| `leave_request` APPROVE | — | `LeaveApproveRelationshipPolicy` | — |
