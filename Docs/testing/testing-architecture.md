# Testing Architecture

## Overview

This document describes the comprehensive testing architecture for the ByteVon CRM FastAPI application. The architecture is designed to validate API behavior across all endpoints in generated `endpoint_inventory.json` (historical discovery notes cited ~200+; the generated file is authoritative), covering contract validation, business rules, authentication, authorization, database persistence, and workflow orchestration.

## Testing Principles

- **Repository-specific**: All recommendations are derived from actual code analysis, not generic testing theory
- **Layered approach**: Tests operate at multiple layers (unit, API, integration, workflow)
- **Deterministic**: Tests must be repeatable with well-defined state
- **Isolated**: Test failures should not cascade across unrelated modules
- **Behavioral coverage**: Focus on whether the application behaves correctly, not just HTTP status codes

## Test Layers

### Layer 1: API Contract Tests
- Validate request/response schemas against OpenAPI definitions
- Verify HTTP status codes for given scenarios
- Test validation of required/optional fields, datatypes, enums
- Located in per-module test files
- Uses FastAPI TestClient or ASGI transport

### Layer 2: Integration Tests
- End-to-end request flow from HTTP through router → dependencies → service → repository → database
- Verify database state after write operations (POST/PUT/PATCH/DELETE)
- Test transaction boundaries and per-test truncate cleanup behavior (rollback alone is insufficient — see `implementation-plan.md`)
- Verify cross-module relationships are maintained

### Layer 3: Workflow Tests
- Multi-step business workflows involving multiple API endpoints
- Sequence of operations representing real business processes
- Verify state transitions and side effects across modules

### Layer 4: Negative/Security Tests
- Authentication failure modes
- Authorization/permission enforcement
- Input validation edge cases
- Conflict and constraint violation scenarios

## Test Boundaries

### What is tested:
- API response correctness (status codes, headers, schema)
- Database persistence of business data
- Authentication token lifecycle (access/refresh)
- Permission enforcement per role/employment
- Business rule validation and state transitions
- Error response format and status codes

### What is NOT tested (without explicit infrastructure):
- Frontend UI behavior
- Third-party external API integrations (mocked appropriately)
- Browser/Client-side behavior
- Infrastructure-level concerns (server health, network latency)

## API Testing Approach

### Request Validation
- Required fields must be present; 422 if missing
- Optional fields behave correctly when absent/null
- Datatype validation (integers, strings, enums, booleans)
- Enum values restricted to defined set
- Null handling per schema definition
- Malformed path parameters and query strings
- Pagination boundaries (limit/offset)
- Sorting and filtering validation

### Response Validation
- HTTP status code matches expected behavior
- Response schema fields present and correctly typed
- Required response fields are never null (where defined)
- Nullable fields may be None
- Error responses follow consistent format:
  ```json
  {"error": {"code": "...", "message": "...", "details": ...}}
  ```

### HTTP Status Code Mapping
- **200**: Successful GET, PUT, PATCH
- **201**: Successful POST (resource creation)
- **204**: Successful DELETE (no content)
- **400**: Bad request (validation, invalid input)
- **401**: Missing/invalid authentication
- **403**: Authenticated but insufficient permission
- **404**: Resource not found
- **409**: Conflict (duplicate, version conflict)
- **422**: Validation error (request body/query)
- **500**: Unexpected server error

## Integration Strategy

### Database Strategy
- Async PostgreSQL with SQLAlchemy 2.x
- `get_db_session()` yields `AsyncSession` without auto-commit
- Public services own transaction boundaries (`_commit`, `_rollback`)
- Tests must manage their own transaction boundaries
- Test data creation via factories or direct repository operations
- Transaction isolation between tests (rollafter or session-per-test)

### Authentication Strategy
- JWT access tokens with `Authorization: Bearer <token>` header
- Token decoded via `get_token_payload` dependency
- Current login verified via `get_current_login` (active check)
- Employment ID from JWT claim or `X-Employment-Id` header
- Test fixtures must generate valid JWT tokens for test scenarios

### Authorization Strategy
- RBAC system with roles, permissions, scopes
- Employee-role assignments with scope limiting (self/team/department/org)
- System role: `Super Admin` (is_system_role=True)
- Horizontal access control: user A cannot access user B's resources
- Vertical access control: regular users cannot admin-only operations

### Test Data Strategy
- No reliance on arbitrary database records
- Factories/fixtures create controlled test data
- Related entities automatically created when needed
- Invalid data generators for validation testing
- Conflict data for duplicate/constraint violation testing

### Workflow Strategy
- Identified business workflows span multiple modules
- Example: create employee → assign role → submit leave → manager approve → balance update
- Workflow tests verify end-to-end state changes
- Each workflow test is independently executable

## Failure Handling

### Failure Classification (for test execution phase)
1. **APPLICATION_DEFECT**: Code bug - behavior differs from specification
2. **TEST_DEFECT**: Test itself has bug - incorrect assertion or setup
3. **TEST_DATA_DEFECT**: Test data issue - stale/insufficient data
4. **TEST_INFRASTRUCTURE_DEFECT**: Missing/broken test infrastructure
5. **ENVIRONMENT_DEFECT**: Database, network, or configuration issue
6. **TRANSIENT_FAILURE**: Intermittent (timeout, lock contention)
7. **UNKNOWN**: Cannot determine cause

For each failure, the workflow is:
1. Reproduce the failure
2. Inspect the failure details
3. Trace the code path
4. Determine expected behavior
5. Compare implementation against expectation
6. Classify the failure type
7. Make the appropriate change (test or code)
8. Rerun relevant tests
9. Run regression tests

## Coverage Strategy

- **Endpoint coverage**: `covered_endpoints / TOTAL_ENDPOINTS` from `endpoint_inventory.json` (target 100%)
- **HTTP method coverage**: GET/POST/PUT/PATCH/DELETE where applicable
- **Scenario coverage**: Success, validation failure, auth failure, authz failure, not-found, conflict, business-rule failure
- **Module coverage**: Track test coverage per module
- **Workflow coverage**: Key business workflows tested end-to-end
- **Code coverage**: Line/branch coverage as secondary metric, not primary success criterion

## Execution Strategy

The test suite should support:
- Run all tests: `pytest`
- Run one module: `pytest modules/`
- Run authentication tests: `pytest -m auth`
- Run workflow tests: `pytest -m workflow`
- Run fast tests (exclude slow/database): `pytest -m not slow`
- Run failed tests only: pytest with --rerun-failures
- Parallel execution where tests are isolated

## External Dependency Strategy

- **MinIO**: Storage service; tests should use mock or local substitute
- **Email**: No external send in tests; compose service should accept any input
- **Notification delivery**: Test at compose/request level, not delivery level
- **Database**: Tests use test database with controlled seed data

## Principles Summary

| Principle | Rationale |
|-----------|-----------|
| Repository-specific | Generic docs don't match ByteVon's JWT+RBAC+Archive mixin architecture |
| Behavior-first | Validate correctness, not just HTTP status |
| Infrastructure-light | Leverage existing FastAPI TestClient; avoid heavy mock frameworks unless needed |
| Deterministic data | Tests must create their own data; not depend on seed records |
| layered coverage | Different test layers catch different classes of bugs |
| Explicit isolation | Transaction boundaries must be managed between tests |