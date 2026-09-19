# Unresolved Questions

## Database and Test Environment

| Question | Why It Matters | Evidence Currently Available | What Needs Confirmation | Impact if Unresolved |
|----------|---------------|----------------------------|------------------------|----------------------|
| **Is there a dedicated test database, or will tests use the development database?** | Using the development database risks corrupting production data or being dependent on arbitrary records. A dedicated test database ensures isolation. | The application uses `DATABASE_URL` from environment variables via Pydantic Settings. There's no separate test DB configuration visible. | Confirm whether `TEST_DATABASE_URL` or similar env var is expected, or if tests should create a separate database. | High - if tests use dev DB, must ensure no accidental writes to development data; may need test data cleanup strategy. |
| **What is the database state after seed_bootstrap.py runs?** | Seed data creates admin, sample staff, RBAC catalog. Tests may depend on these records. | Seed script creates: admin user (employment 1), 3 sample staff, RBAC catalog, org masters. | Verify which seed records are safe to depend on vs. which should be created by tests themselves. | Medium - may create test data dependency on specific IDs (e.g., employment_id=1 for super admin). |
| **~~How should transaction cleanup work between tests?~~ RESOLVED** | Dedicated test DB + SERIAL + per-test `TRUNCATE ... RESTART IDENTITY CASCADE` (TASK-012, verified by TASK-017). Rollback alone is insufficient (background `AsyncSessionLocal()` sessions bypass it). | `get_db_session()` yields session; services own commit; approval/audit/notification handlers use independent sessions (`lifespan.py`, `base_public_service.py`). | None — strategy is binding. | None. |

## Authentication

| Question | Why It Matters | Evidence Currently Available | What Needs Confirmation | Impact if Unresolved |
|----------|---------------|----------------------------|------------------------|----------------------|
| **Does the X-Login-Id header work without a valid Bearer token?** | Some endpoints (change-password, logout) require both `X-Login-Id` and `Authorization: Bearer`. | `get_current_employment_id` prefers JWT employment_id; allows `X-Employment-Id` override. But `/auth/change-password` and `/auth/logout` explicitly require `X-Login-Id` header. | Confirm whether `X-Login-Id` alone (without Bearer) can authenticate these endpoints, or if a valid token is always required. | Medium - affects auth fixture design for change-password and logout tests. |
| **What happens when a refresh token is used after the associated session is revoked?** | Refresh tokens are stored as hashes in sessions table; revoking a session should invalidate the refresh token. | Refresh token verification in JWT Manager decodes and checks type="refresh". No explicit test for revoked refresh token. | Test behavior when refresh token used after logout/session revocation. | Low - edge case; can be documented as "refresh token invalid after session revocation". |
| **Are there token reuse scenarios to test?** | Can the same access token be used from multiple concurrent requests? | No explicit code for token tracking (tokens are not stored server-side). | Verify if token reuse is allowed or produces errors. | Low - JWT tokens are stateless; reuse should work same as single use. |

## Authorization

| Question | Why It Matters | Evidence Currently Available | What Needs Confirmation | Impact if Unresolved |
|----------|---------------|----------------------------|------------------------|----------------------|
| **What is the exact scope enforcement mechanism: code-level or database-level?** | Horizontal access control depends on how scope (self/team/department/org) is enforced. | RBAC service has `get_effective_permissions(employment_id)`. Scopes defined in Role model with `scope` field. | Inspect RBAC service code to determine if scope checking is in service layer or database constraint. | Medium - affects how authorization tests are written; code-level vs DB-level changes test approach. |
| **Can a user with DEPARTMENT scope access employees in their department only, or all departments?** | Scope definition determines test boundaries. | ScopeName enum: SELF, TEAM, DEPARTMENT, LOCATION, ORGANIZATION. | No code found showing exact DEPARTMENT boundary behavior. | High - directly affects authorization test design for dept-scoped operations. |
| **~~Is the "Super Admin" role truly unrestricted?~~ RESOLVED** | See authoritative Super Admin Contract in `implementation-plan.md`: bypasses all scope/permission checks; cannot bypass authentication, 404, business rules, DB constraints; cannot delete/rename system roles. | `is_system_role=True`; `SUPER_ADMIN_ROLE_NAME`; business-rule guards (e.g. requester cannot approve own request). | None — contract is binding. | None. |
| **Do permission checks happen at the service layer or repository layer?** | Affects whether mocking/service stubs work for authorization tests. | RBAC service `service.approve()` likely calls permission check internally. | Trace through one approval endpoint to determine exact check location. | Low - either way, tests can call endpoint and verify 403/404; doesn't change test approach much. |

## Module-Specific

| Question | Why It Matters | Evidence Currently Available | What Needs Confirmation | Impact if Unresolved |
|----------|---------------|----------------------------|------------------------|----------------------|
| **Are there any endpoints that don't follow the standard router pattern?** | Some endpoints may have unusual auth/dependency patterns. | All modules follow router pattern with ActorHeader (X-Employment-Id). But some my-work endpoints use different headers (X-Login-Id). | Verify all endpoints consistent; note any exceptions. | Low - documented exceptions can be handled in test fixtures. |
| **Do any endpoints accept/return files/documents that need special test handling?** | File upload/download endpoints need MIME type handling, temp files, etc. | Notification compose endpoint accepts body; document endpoints handle files. | No raw file upload endpoints found in routes; document routes handle metadata, not binary files. | Low - if no binary file endpoints, no special handling needed. |
| **Are there any background jobs or scheduled tasks that need test coverage?** | Jobs running outside HTTP cycle need separate test approach. | `lifespan.py` registers approval decision handlers for leave/attendance. No cron/scheduled jobs found. | Confirm no separate background job execution mechanism exists. | Low - if no background jobs, no test coverage needed for that category. |
| **Is the dashboard endpoint /dashboard/executive meant to be tested?** | Dashboard is currently a stub returning hardcoded values. | `dashboard/routes.py` executive_dashboard() returns static dict with "not wired yet". | Determine if dashboard should be tested at all (stub) or when it's wired up. | Medium - if stub, may skip dashboard tests until real implementation; document as known gap. |

## Testing Infrastructure

| Question | Why It Matters | Evidence Currently Available | What Needs Confirmation | Impact if Unresolved |
|----------|---------------|----------------------------|------------------------|----------------------|
| **~~Should pytest-xdist be used for parallel test execution?~~ RESOLVED: SERIAL ONLY** | With a shared truncate-based test DB, parallel execution is unsafe. | No pytest.ini or pyproject.toml found; truncate strategy requires serial execution. | None — SERIAL ONLY unless architecture changes to isolated DBs per worker. | None. |
| **What coverage tool is preferred: pytest-cov, coverage.py, or neither?** | Coverage reporting needs a tool. | No coverage configuration in repository. | Ask project maintainers or decide on standard (pytest-cov is standard for pytest). | Low - can add configuration; doesn't affect test design. |
| **Should tests be organized by module or by endpoint type?** | Affects directory structure and import paths. | No existing test directory structure. | Ask team preference or decide based on workflow importance. | Low - either organization works; document decision in execution-order.md. |
| **What is the expected test runtime target?** | Helps prioritize which tasks to complete first. | No timing data available. | Determine: fast feedback (<5min for P0), full suite (<30min), or nightly only. | Medium - affects task priority and parallelization level. |

## Workflow Testing

| Question | Why It Matters | Evidence Currently Available | What Needs Confirmation | Impact if Unresolved |
|----------|---------------|----------------------------|------------------------|----------------------|
| **~~How are sensitive fields filtered?~~ RESOLVED** | See authoritative Sensitive Field Contract in `implementation-plan.md`: can_read=false → field OMITTED (not null); can_update=false → 400 on write; Super Admin implicit full access; filtering at serialization boundary. | `SensitiveField` + `RoleSensitiveFieldPermission` models; `get_effective_permissions`. | None — contract is binding. | None. |
| **Should workflow tests include database state assertions, or response-only assertions?** | Mixed approach possible but need consistency. | Workflow docs describe expected state changes; no decision made on assertion level. | Decide: all workflow tests must verify DB state, or response-level only for some. | High - affects test code volume and reliability. |
| **Which workflows are P0 vs P1 vs P2?** | Prioritizes implementation order. | Preliminary classification in implementation-plan.md, but not confirmed. | Get stakeholder confirmation on business criticality ranking. | High - affects task execution order in execution-order.md. |
| **Should workflow tests be independent (no shared data) or sequential (shared data)?** | Independent tests are more reliable but create more data duplication. | No decision made. | Determine based on team preference and test runtime tolerance. | Medium - affects test design and DB cleanup strategy. |

## General

| Question | Why It Matters | Evidence Currently Available | What Needs Confirmation | Impact if Unresolved |
|----------|---------------|----------------------------|------------------------|----------------------|
| **Is there a code owners or review process for test files?** | Determines if test code follows same review patterns as app code. | No TESTING_COPERS.md or similar found. | Confirm process or establish informal review guidelines. | Low - doesn't affect test functionality. |
| **Should test files be placed under app/modules/ or a separate tests/ directory?** | Affects import paths and project structure. | No existing test directory; import paths use `app.modules.xxx`. | Ask team preference; both approaches work with FastAPI/TestClient. | Low - either works; document in execution-order.md. |
| **What Python version is targeted for test dependencies?** | Affects factory library choices (pydantic-factories version, etc.). | Python version from requirements or setup. | Confirm Python 3.10+ or 3.12+; affects which libraries can be used. | Low - can adapt factory patterns to available Python version. |