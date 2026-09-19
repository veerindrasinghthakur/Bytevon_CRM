# Test Strategy

## Overview

The test strategy for ByteVon CRM focuses on comprehensive API and integration testing across the endpoints in generated `endpoint_inventory.json` (illustrative count from discovery: ~269+ across 14 module routers; the generated file is authoritative). The strategy validates correct application behavior, not just successful HTTP responses.

## Testing Goals

| Goal | Description |
|------|-------------|
| API Contract Validation | Verify request/response schemas, HTTP status codes, and error formats |
| Business Rule Verification | Ensure business logic operates correctly across all modules |
| Authentication & Authorization | Validate token-based auth and RBAC permission enforcement |
| Database Persistence | Confirm write operations persist data correctly and transactions are managed |
| Workflow Validation | Test multi-step business workflows across module boundaries |
| Negative/Security Testing | Identify validation gaps, injection points, and access control failures |

## Test Pyramid Allocation

| Layer | Scope (from inventory) | Focus |
|-------|------------------------|-------|
| API Contract | All `TOTAL_ENDPOINTS` | Request validation, response schema, status codes |
| Integration | All `WRITE_ENDPOINTS` + critical reads | Full request flow, database state verification |
| Workflow | All `WORKFLOW_COUNT` (=8) workflows | End-to-end business processes across modules |
| Negative/Security | Selective per profile | Auth failure, authorization, validation errors |

## API Contract Testing

### Request Validation
- **Required fields**: Must be present; 422 ValidationError if missing
- **Optional fields**: Behavior when absent/null per schema definition
- **Datatype validation**: Integers, strings, booleans validated against schema
- **Enum validation**: Values restricted to defined set; 422 if invalid
- **Null handling**: Per-field nullable definition in schema
- **Malformed path parameters**: Non-integer IDs → 422 from FastAPI
- **Query parameter validation**: limit/offset bounds, valid enums, filter values
- **Pagination**: Default limit, max limit, offset starting at 0

### Response Validation
- **HTTP status code**: Matches expected code for the scenario
- **Response schema fields**: All required fields present, correctly typed
- **Nullable fields**: May be null/None where defined in schema
- **Error response format**:
  ```json
  {"error": {"code": "...", "message": "...", "details": ...}}
  ```
- **Success response**: Contains data matching declared schema

### HTTP Status Code Mapping
| Code | When |
|------|------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource creation) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request (validation, invalid input) |
| 401 | Missing/invalid authentication |
| 403 | Authenticated but insufficient permission |
| 404 | Resource not found |
| 409 | Conflict (duplicate, version conflict) |
| 422 | Validation error (request body/query) |
| 500 | Unexpected server error |

## Integration Testing

### Database Strategy
- Async PostgreSQL with SQLAlchemy 2.x
- `get_db_session()` yields `AsyncSession` without auto-commit
- Public services own transaction boundaries (`_commit`, `_rollback`)
- Tests must manage their own transaction boundaries
- Test data creation via factories or direct repository operations
- Transaction isolation between tests (rollafter_commit or session-per-test)

### Flow Verification
1. HTTP request through FastAPI TestClient/ASGI transport
2. Router dispatches to endpoint function
3. Dependency injection: authentication → authorization → service
4. Service layer business logic
5. Repository layer database operations
6. SQLAlchemy async execution
7. PostgreSQL persistence
8. Response serialization and return

### Transaction Boundaries
- Each test must begin and end with a clean database state
- Transaction rollback alone is INSUFFICIENT: approval decision handlers, audit,
  and notifications create independent `AsyncSessionLocal()` sessions that bypass
  any test transaction (`lifespan.py`, `base_public_service.py`).
- Isolation strategy: dedicated test DB + SERIAL execution +
  per-test `TRUNCATE ... RESTART IDENTITY CASCADE` (see `implementation-plan.md` TASK-012/TASK-017).
- Public services commit after business work, then call best-effort notification/audit

## Authentication Testing

### Applicable Scenarios
| Scenario | Endpoints Affected | Expected Behavior |
|----------|-------------------|-------------------|
| No credentials | All protected endpoints | 401 Unauthorized with WWW-Authenticate: Bearer |
| Invalid token | All protected endpoints | 401 Invalid or expired token |
| Expired token | All protected endpoints | 401 ExpiredTokenException |
| Valid token | All authenticated endpoints | 200 with user claims in payload |
| Inactive account | /auth/sessions, any endpoint requiring current login | 401 Login inactive or not found |
| Refresh token flow | POST /auth/refresh | 200 new token pair |
| Revoked session | POST /auth/logout | 200 sessions revoked |

### Authentication Fixtures Needed
- `client`: FastAPI TestClient with app instance
- `access_token`: Valid JWT access token for test user
- `refresh_token`: Valid JWT refresh token for test user
- `auth_headers`: `{"Authorization": "Bearer <token>"}`
- `employment_id`: Test user's employment ID from token

## Authorization Testing

### Roles and Permissions
- **Super Admin** (is_system_role=True): Full system access
- **Role-based**: Assignments with scope limiting (self/team/department/organization)
- **Resource permissions**: Per-resource, per-action (create/read/update/delete)
- **Sensitive field permissions**: Hide/show fields based on role

### Authorization Scenarios
| Scenario | Description | Test Approach |
|----------|-------------|---------------|
| Allowed actor | Super Admin or resource owner | Verify operation succeeds |
| Unauthorized actor | Authenticated user without permission | 403 Forbidden or 404 Not Found |
| Authenticated but insufficient permission | Regular user attempting admin operation | 403 or 404 |
| Wrong role | User with limited role attempting restricted operation | 403/404 |
| Resource owner | User accessing their own resources | 200 OK |
| Non-owner | User attempting another user's resources | 403/404 (horizontal access control) |
| Administrative actor | Admin user across all resources | 200 OK (if permissions allow) |

### Key Focus Areas
- **Horizontal access control**: User A cannot access User B's resources (critical for /employees, /leaves, /requests, /approvals)
- **Department-scoped access**: Users can only access resources within their department
- **Team-scoped access**: Team members can access team-related resources
- **Self-scoped access**: Users can always access their own data

## Workflow Testing

### Identified Business Workflows

| Workflow | Starting State | Sequence | Expected End State |
|----------|---------------|----------|-------------------|
| Create employee | No employment | POST /workforce/employees → person + employment | Employee record in DB |
| Submit leave request | Employee exists | POST /my-work/leave/ → create request | Pending approval request |
| Manager approval | Pending leave request | POST /approvals/{id}/approve → status change | Approved request |
| Leave balance update | Approved leave | Service-side recalculation | Updated balance |
| Cancel leave request | Pending leave request | POST /leave/requests/{id}/cancel | Cancelled request |
| Approve payroll | Pending payroll run | POST /payroll/{id}/approve | Marked as paid |

### Workflow Test Structure
```
Given: Setup test data (employee, role, etc.)
When: Execute API sequence (e.g., create → submit → approve)
Then: Verify final state (database + API responses)
And: Clean up (rollback/teardown)
```

## Negative Testing

### Systematic Negative-Testing Strategy

| Category | Applicable Endpoints | Examples |
|----------|---------------------|----------|
| Missing required field | All POST/PUT endpoints with required body fields | Create person without first_name |
| Invalid datatype | Type mismatch (string where integer expected) | Employee employment_id as "abc" |
| Invalid enum | Value not in defined enum set | Leave request with invalid status |
| Null value | Field explicitly null when not allowed | Person with null first_name |
| Empty value | Empty string where minimum length required | Login with empty email |
| Malformed identifier | Non-existent resource ID | GET /employees/999 |
| Nonexistent resource | GET/PUT/DELETE on id=999 | 404 Not Found |
| Unauthorized request | No credentials or invalid token | 401 Unauthorized |
| Forbidden request | Authenticated but wrong role | 403 Forbidden |
| Invalid state | Operation in wrong state | Transition from ARCHIVED |
| Invalid transition | State change not allowed | Approve already-approved request |
| Conflict | Duplicate resource creation | Create same person twice |
| Boundary violation | Pagination beyond range | limit=999999 |
| Invalid pagination | offset < 0 or limit > max | 422 ValidationError |
| Invalid filter | Non-existent filter value | Filter by invalid status |
| Invalid sort | Field not available for sorting | Sort by invalid field |
| Expired authentication | Valid token but past expiry | 401 after token expiry |
| Cross-user resource access | User A accesses User B's resource | 403/404 |

### Negative Testing Philosophy
- Do not mechanically apply every case to every endpoint
- Map appropriate scenarios based on endpoint behavior and business risk
- Prioritize horizontal access control for employee/user-owned resources
- Prioritize validation for endpoints accepting request bodies

## Database Verification

### Endpoints Requiring Database Assertions
| Endpoint Category | Verification Needed |
|-------------------|---------------------|
| POST (create) | Verify entity persisted in database |
| PUT/PATCH (update) | Verify updated fields in database |
| DELETE (delete) | Verify entity soft-deleted (is_archived) or removed |
| State transitions | Verify state change in database |
| Approval actions | Verify request status + side effects (leave/attendance updates) |
| Workflow actions | Verify cascading state changes |

### Endpoints Where Response Assertions Suffice
| Endpoint Category | Assertion Level |
|-------------------|-----------------|
| GET (list/detail) | Response schema + status code (no DB query needed for test) |
| Filter/list endpoints | Response schema + status code |
| Filtered queries | Response schema + status code |
| Metadata/options endpoints | Response schema + status code |

### Database Assertion Pattern
```python
# After POST/PUT/PATCH/DELETE
async with async_session() as session:
    result = await session.get(Entity, id)
    assert result.field == expected_value
    # Or for soft delete
    assert result.is_archived == True
```

## Idempotency and State Transitions

### Endpoints with State Transition Concerns
| Endpoint | Valid Transition | Invalid Transition | Repeated Call |
|----------|-----------------|-------------------|---------------|
| /workforce/positions/{id}/archive | Active → Archived | Already archived | Idempotent (no error) |
| /admin/users/{id}/activate | Inactive → Active | Already active | May return 200 or error |
| /admin/users/{id}/deactivate | Active → Inactive | Already inactive | May return 200 or error |
| /leave/requests/{id}/cancel | Pending → Cancelled | Not in pending state | May return 400 |
| /approvals/{request_id}/approve | Pending → Approved | Already approved/rejected | May return 400 |
| /payroll/{id}/approve | Pending → Approved | Already approved | May return 400 |
| /workforce/attendance/summaries/{ei}/{y}/{m}/lock | Unlocked → Locked | Already locked | May return 400 |
| /attendance/corrections | Submit → Processed | Already processed | May return 400 |

### Idempotency Testing
- Call endpoint twice with same valid input
- Verify second call behaves same as first (or returns appropriate idempotent error)
- For state transitions: verify final state is correct regardless of call count
- For create operations: second call may be no-op or create duplicate (depends on business logic)

## External Dependency Strategy

| Dependency | Testing Approach |
|------------|-----------------|
| MinIO (storage) | Mock local substitute; test compose/notify at request level |
| Email delivery | Test at compose/notify request level; not at delivery level |
| External APIs | Contract test or mocked dependency based on configuration |
| Background tasks | Test task creation; execution verified separately |
| Database | Test with dedicated test database, not production |

### Distinction: Real Integration vs Mock
- **Real integration test**: Verify endpoint → service → repository → database round-trip
- **Mocked external dependency**: MinIO, email delivery, third-party APIs
- **Contract test**: Validate request/response shape without external dependency
- **Local test substitute**: In-memory alternatives for cloud services

## Failure Classification

### Failure Types (for test execution phase)
1. **APPLICATION_DEFECT**: Code bug - behavior differs from specification
2. **TEST_DEFECT**: Test itself has bug - incorrect assertion or setup
3. **TEST_DATA_DEFECT**: Test data issue - stale/insufficient data
4. **TEST_INFRASTRUCTURE_DEFECT**: Missing/broken test infrastructure
5. **ENVIRONMENT_DEFECT**: Database, network, or configuration issue
6. **TRANSIENT_FAILURE**: Intermittent (timeout, lock contention)
7. **UNKNOWN**: Cannot determine cause

### Failure Classification Workflow
1. **Reproduce**: Run test independently to confirm failure
2. **Inspect**: Read failure output (stack trace, response body, DB state)
3. **Trace**: Follow code path from endpoint through service → repository → DB
4. **Determine expected**: Check what behavior should be (spec, code logic)
5. **Compare**: Implementation vs expectation
6. **Classify**: Assign failure type from the 7 categories
7. **Fix**: Make appropriate change (test or code)
8. **Rerun**: Execute relevant tests to verify fix
9. **Regression**: Run related tests to ensure no collateral damage