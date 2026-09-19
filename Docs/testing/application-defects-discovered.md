# Application Defects Discovered

During the analysis phase, several observations were made. **Note: None were fixed per task rules; all are documented for future investigation.**

## Potential Defects and suspicious behavior

### 1. Auth: X-Login-Id vs X-Employment-Id inconsistency

| Area | Observation | Evidence | Confidence |
|------|-------------|----------|------------|
| `/auth/change-password` and `/auth/logout` require `X-Login-Id` header specifically, but the JWT payload contains `employment_id`, not `login_id`. | The `get_current_login` dependency fetches the `Login` record by `login_id` from the token payload. The `X-Login-Id` header is a separate mechanism. | **Medium** - The two mechanisms (JWT claims vs HTTP headers) may not be aligned. If a test generates a token without explicitly setting `login_id` in claims, the `X-Login-Id` header may be the only way to authenticate. Need to verify that `generate_access_token` includes `login_id` in claims (it does - see jwt_manager.py line 48: `"login_id": login_id`). | 
| **Impact**: Tests for change-password and logout must provide `X-Login-Id` header in addition to Bearer token, or rely solely on JWT claims. | 

### 2. RBAC: Scope enforcement gap for `self` scope

| Area | Observation | Evidence | Confidence |
|------|-------------|----------|------------|
| The `ScopeName.SELF` scope is defined in the SCOPE_SEED data and used in RBAC, but there's no visible code showing how `self` scope is enforced in service layer queries. | `SCOPE_SEED` in seed_bootstrap.py defines `ScopeName.SELF` as "Own records only". The `Role` model likely has a `scope` field. But the actual query filtering by scope isn't visible in the route files read. | **Medium-high** - Without visible enforcement code, it's unclear if `self` scope is automatically applied by the service layer or must be explicitly queried. This could mean `self` scope has no effect, or it's enforced at a different layer. | 
| **Impact**: Authorization tests for `self` scope may not behave as expected; need to trace into service layer to verify. | 

### 3. Dashboard stub status

| Area | Observation | Evidence | Confidence |
|------|-------------|----------|------------|
| The `/dashboard/executive` endpoint returns hardcoded stub data with message "Dashboard aggregations not wired yet". | `app/modules/dashboard/routes.py:13` returns `{"kpis": [], "recentActivities": [], ... "message": "Dashboard aggregations not wired yet"}`. | **High** - This is a known incomplete feature, not a defect per se. But it means: | 
| **Impact**: Dashboard tests should be marked as P3 (lower priority) or skipped until the endpoint is real. The workflow testing doc notes this as a known gap. | 

### 4. No test infrastructure exists

| Area | Observation | Evidence | Confidence |
|------|-------------|----------|------------|
| No conftest.py, no test files, no pytest configuration, no factories. | Exploration confirmed: no test files exist anywhere in the backend; BACKEND_REQUIREMENTS.md item "Unit + integration tests" is open. | **High** - This is the primary finding: the testing initiative starts from zero. All test infrastructure must be built. | 
| **Impact**: All tasks TEST-001 through TEST-005 are new infrastructure creation; no existing tests to extend or modify. | 

### 5. Transaction boundary ownership

| Area | Observation | Evidence | Confidence |
|------|-------------|----------|------------|
| `get_db_session()` yields session without committing or rolling back, and the doc states "Public Services own the transaction boundary." But it's not explicitly documented which layer (service vs repository vs test) is responsible for begin/commit/rollback. | `app/core/database.py:34-43`: `get_db_session()` yields session, does NOT commit/rollback. `app/core/services/base_public_service.py` has `_commit` and `_rollback` methods. | **Medium** - The boundary ownership needs clarification. If tests try to commit/rollback the session, they may conflict with service-layer transaction management. | 
| **Impact**: Task TEST-001 (test database environment) must decide: session-per-test with test-level transaction management, or rely on service-layer boundaries. | 

### 6. Potential issue: Soft-delete (ArchiveMixin) not consistently tested

| Area | Observation | Evidence | Confidence |
|------|-------------|----------|------------|
| Multiple models use `ArchiveMixin` (is_archived, archived_at, archived_by) for soft-delete, but there are no tests verifying the archive behavior (PATCH to archive, GET with is_archived filter, DELETE as soft-delete). | Base models include `ArchiveMixin`. Routes like `/positions/{id}/archive`, `/users/{id}/archive`, `/holiday-calendars/{id}/archive` exist. | **Medium** - Soft-delete is a common source of bugs (queries not filtering is_archived, updates affecting archived records etc.). | 
| **Impact**: Should add archive behavior tests as part of negative or state-transition testing. | 

### 7. RBAC: Role creation requires `actor_employment_id` but some routes don't check it

| Area | Observation | Evidence | Confidence |
|------|-------------|----------|------------|
| RBAC routes (create_role, update_role, etc.) accept `actor: ActorHeader = None` but the service may or may not use it for permission checks. | `rbac/routes.py:69-71`: `create_role` passes `actor_employment_id=actor` to service. But the service implementation isn't visible in routes.py. | **Low-Medium** - The actor parameter is passed through; whether it's enforced is in the service layer. | 
| **Impact**: RBAC authorization tests need to verify that role creation/update respects the actor's employment_id and associated permissions. | 

### 8. Approval decision handlers may create new database sessions

| Area | Observation | Evidence | Confidence |
|------|-------------|----------|------------|
| `lifespan.py` registers approval decision handlers that create new `AsyncSessionLocal()` sessions on decision event. | `_leave_approval_decision_handler` and `_attendance_approval_decision_handler` both use `async with AsyncSessionLocal() as session:`. | **Low** - This is lifecycle behavior, not a defect. But it means: approval events fired outside HTTP request cycle create independent sessions. | 
| **Impact**: If tests trigger approval events (via the API), the decision handlers may create separate DB sessions that don't share transaction state with the test. This could cause data consistency issues. | 

## Summary of Confirmed vs Suspected

| Category | Confirmed | Suspected | Evidence Level |
|----------|-----------|-----------|----------------|
| Infrastructure gaps | **Confirmed** | None | High - no test files, no conftest, no pytest config |
| Auth mechanism alignment | **Suspected** | Medium - X-Login-Id vs JWT claims alignment |
| RBAC scope enforcement | **Suspected** | Medium-high - enforcement code not visible |
| Dashboard stub status | **Confirmed** | High - explicitly "not wired yet" |
| Transaction boundary | **Suspected** | Medium - ownership not explicitly documented |
| Soft-delete testing | **Suspected** | Medium - no archive behavior tests found |
| RBAC actor enforcement | **Suspected** | Low-Medium - actor passed but enforcement unclear |
| Approval decision handler session scope | **Suspected** | Low - handlers create new sessions outside request cycle |
| Application defects requiring code fixes | **None** | - | - |

**Per task rules: No application source code was modified during analysis. All defects are documented for future investigation without modification.**