# Final Analysis Summary (HISTORICAL Phase-1 analysis — SUPERSEDED for counts)

> Endpoint counts below (274+) are illustrative static-discovery figures.
> The authoritative count is generated `endpoint_inventory.json` (TASK-001).
> Authorization/data/isolation conclusions are superseded by `implementation-plan.md`
> (Super Admin Contract, Sensitive Field Contract, truncate + SERIAL strategy).

## Repository Size/Structure

| Aspect | Detail |
|--------|--------|
| **Total routes.py files** | 62 |
| **Total endpoint definitions** | 274+ (from regex extraction; actual count may be higher with parameterized routes) |
| **Application framework** | FastAPI 0.115+ |
| **ASGI server** | uvicorn[standard] |
| **Database** | Async PostgreSQL with SQLAlchemy 2.x, asyncpg |
| **Models/tables** | 50+ tables defined in Alembic schema; IdentityMixin, TimestampMixin, ArchiveMixin, EffectiveDatingMixin, AuditActorMixin, CreatedAtMixin |
| **Authentication** | JWT access tokens (HS256, 30 min expiry), refresh tokens stored as hashes in sessions table |
| **Authorization** | RBAC system with roles, permissions, scopes (SELF/TEAM/DEPARTMENT/LOCATION/ORGANIZATION); Employee-role assignments |
| **Modules** | 16+ modules: auth, workforce, leave, approvals, admin, rbac, sales, project, notifications, payroll, my_work, dashboard |
| **No existing test infrastructure** | No conftest.py, no test files, no pytest config, no factories |
| **Seed data** | `scripts/seed_bootstrap.py` creates admin, 3 sample staff, RBAC catalog, org masters |
| **CORS** | Development origins: localhost:5173, 5174, 3000; production origins from config |
| **Exception handling** | Custom AppException hierarchy (NotFound/Validation/Conflict/Unauthorized/Forbidden/Domain) with FastAPI handlers |
| **Lifespan** | Startup: lead column patches, approval decision handler registration; Shutdown: engine dispose |

## Total Endpoints Discovered

| Category | Count |
|----------|-------|
| auth | 7 endpoints |
| workforce/employee | 15 endpoints |
| workforce/attendance | 10 endpoints |
| my-work/attendance | 9 endpoints |
| my-work/leave | 4 endpoints |
| my-work/tasks | 1 endpoint |
| my-work/requests | 1 endpoint |
| my-work/approvals | 1 endpoint |
| my-work/profile | 4 endpoints |
| admin/user | 11 endpoints |
| rbac | 20+ endpoints |
| notifications | 15+ endpoints |
| project | 10+ endpoints |
| sales | 12+ endpoints |
| payroll | 12+ endpoints |
| admin/other | 7+ endpoints |
| **Total** | **274+** |

## Endpoints Per Module

| Module | Endpoints | Auth Required | DB Interaction |
|--------|-----------|---------------|----------------|
| auth | 7 | Public (login) / Bearer (protected) | No (auth only) |
| workforce/employee | 15 | Bearer (X-Employment-Id) | Yes (CRD on persons/positions/employments) |
| workforce/attendance | 10 | Bearer (X-Employment-Id) | Yes (punch, corrections, summaries) |
| my-work/attendance | 9 | X-Employment-Id header | Yes (self-service punch/breaks) |
| my-work/leave | 4 | Query params optional | Yes (leave requests, balances) |
| my-work/tasks | 1 | Query params | Limited |
| my-work/requests | 1 | Query params + optional header | Limited |
| my-work/approvals | 1 | Optional header | Limited |
| my-work/profile | 4 | Optional headers (X-Login-Id, X-Employment-Id) | Limited |
| admin/user | 11 | Bearer (X-Employment-Id) | Yes (CRUD on admin users) |
| rbac | 20+ | Bearer (X-Employment-Id) | Yes (roles, permissions, scopes) |
| notifications | 15+ | Bearer (X-Employment-Id) | Yes (templates, inbox, sent) |
| project | 10+ | Bearer (X-Employment-Id) | Yes (projects, tasks, documents) |
| sales | 12+ | Bearer (X-Employment-Id) | Yes (leads, clients, sources) |
| payroll | 12+ | Bearer (X-Employment-Id) | Yes (salary, payroll runs, payslips) |
| admin/other | 7+ | Bearer (X-Employment-Id) | Yes (positions, shifts, working weeks, locations, holidays, settings) |

## Existing Tests

- **None**: No test files exist in the repository
- **No conftest.py**: No shared fixtures
- **No pytest configuration**: No pytest.ini, setup.cfg, or pyproject.toml
- **No factories**: No reusable test data objects
- **Seed data available**: `scripts/seed_bootstrap.py` for initial data setup

## Existing Testing Infrastructure

| Item | Status |
|------|--------|
| pytest | Not configured (no config files found) |
| TestClient/ASGI transport | Available (FastAPI native; must be set up in tasks) |
| conftest.py | Does not exist |
| Factories/ builders | Do not exist |
| Database fixtures | None (get_db_session() dependency exists) |
| Authentication fixtures | None (must be created) |
| Authorization fixtures | None (must be created) |
| Coverage configuration | None |
| CI test execution | Not configured |
| Docker-based test execution | Not confirmed |

## Testing Gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| No test infrastructure (pytest, conftest, TestClient setup) | P0 | All test creation must start from scratch |
| No test data factories | P1 | Each test must manually construct data; high boilerplate |
| No authentication test fixtures | P1 | Auth tests cannot run without token generation setup |
| No authorization/permission tests | P1 | Horizontal access control and RBAC untested |
| No module-level API tests | P2 | Historical count (274+): no automated coverage at time of analysis; authoritative target is 100% of `endpoint_inventory.json` |
| No workflow/integration tests | P2 | Business processes across modules untested |
| No negative/security testing | P2 | Validation errors, conflict scenarios, edge cases untested |
| Dashboard stub with no real implementation | P3 | Executive dashboard tests would be premature |
| No coverage reporting | P3 | Cannot measure test suite completeness |
| No failure classification methodology | P3 | Future test runners won't know how to classify failures |

## Authentication Architecture

- **JWT access tokens**: Short-lived (30 min default), not stored server-side
- **Refresh tokens**: Stored as hashes in `sessions` table (30 days default)
- **Token claims**: `sub` (login_id string), `login_id` (int), `person_id` (int), `employment_id` (Optional[int]), `type` ("access"/"refresh"), `jti`
- **Two auth mechanisms**: 
  1. JWT `employment_id` claim (preferred)
  2. `X-Employment-Id` HTTP header (optional override)
- **Password**: bcrypt via `PasswordManager` class; account lockout after 5 failed attempts, 20-min lockout
- **Dependencies chain**: `get_token_payload` → `get_current_login` → `get_current_employment_id`
- **Public endpoints**: `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`