# Authentication & Authorization Testing

## Authentication Analysis

### Mechanism
- **JWT-based access tokens** (python-jose, HS256 algorithm)
- **Access tokens**: Short-lived (default 30 minutes), not stored server-side
- **Refresh tokens**: Stored as hashed values in `sessions` table, longer-lived (default 30 days)
- **Token claims**: `sub` (login_id), `login_id`, `person_id`, `employment_id`, `type` ("access"/"refresh"), `jti`

### Token Lifecycle
1. **Login** (POST /auth/login) → returns access + refresh token pair
2. **Access token use** → `Authorization: Bearer <access_token>` header on protected routes
3. **Token expiry** → 401 after JWT expiry (30 min default)
4. **Refresh** (POST /auth/refresh) → new access token using refresh token
5. **Logout** (POST /auth/logout) → revoke current or all sessions
6. **Password change** (POST /auth/change-password) → invalidate existing tokens
7. **Password reset flow** (forgot → reset) → temporary token for password reset

### Authentication Dependencies (from code analysis)
```
get_token_payload → get_current_login → get_current_employment_id
```
- `get_token_payload`: Decodes JWT, validates it's an access token
- `get_current_login`: Queries Login table, checks `is_active`
- `get_current_employment_id`: Prefer JWT employment_id; fallback to X-Employment-Id header
- `get_optional_employment_id`: Best-effort resolution; does not fail if unauthenticated

### Authentication Testing Scenarios

| Scenario | Endpoint(s) | Expected Status | Notes |
|----------|-------------|-----------------|-------|
| No credentials | All protected endpoints | 401 Unauthorized | WWW-Authenticate: Bearer header |
| Invalid token format | All protected endpoints | 401 Invalid or expired token | Malformed JWT |
| Expired access token | All protected endpoints | 401 ExpiredTokenException | Past `exp` claim |
| Invalid token type | All protected endpoints | 401 Access token required | Token type != "access" |
| Valid access token | All authenticated endpoints | 200 OK | User claims verified |
| Inactive account | Any endpoint requiring current login | 401 Login inactive or not found | `is_active` check in get_current_login |
| Revoked session | POST /auth/logout | 200 OK | All sessions for login_id revoked |
| Refresh token flow | POST /auth/refresh | 200 new token pair | Using valid refresh token |
| Missing X-Login-Id | /auth/change-password, /auth/logout | 400/401 | Header required for these endpoints |

### Authentication Fixtures

```python
# conftest.py fixture examples

import pytest
from fastapi.security import HTTPBearer
from app.core.security.jwt_manager import JWTManager
from app.core.config import settings

@pytest.fixture
def jwt_manager():
    return JWTManager()

@pytest.fixture
def access_token(jwt_manager, db_session, regular_user):
    """Generate a valid access token for the regular user."""
    return jwt_manager.generate_access_token(
        login_id=regular_user.login_id,
        person_id=regular_user.person_id,
        employment_id=regular_user.employment_id,
    )

@pytest.fixture
def auth_headers(access_token):
    """Standard authorization headers for TestClient."""
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
def super_admin_token(jwt_manager, super_admin_user):
    """Generate access token for super admin."""
    return jwt_manager.generate_access_token(
        login_id=super_admin_user.login_id,
        person_id=super_admin_user.person_id,
        employment_id=super_admin_user.employment_id,
    )

@pytest.fixture
def auth_headers_super(super_admin_token):
    """Auth headers for super admin."""
    return {"Authorization": f"Bearer {super_admin_token}"}
```

## Authorization Analysis

### RBAC System
- **Resources**: employment, department, location, role, user, leave_request, leave_policy, attendance, payroll, salary, project, task, lead, client, approval, audit, notification, org_settings, shift, holiday, document, note
- **Actions**: All Action enum values (CREATE, READ, UPDATE, DELETE, APPROVE, REVIEW, etc.)
- **Roles**: Super Admin (is_system_role=True), Standard User, Department Manager, HR Executive, Sales Rep, etc.
- **Permissions**: Per-resource, per-action assignments
- **Scopes**: SELF (own records only), TEAM (team members), DEPARTMENT, LOCATION, ORGANIZATION

### Employee-Role Assignments
- Each employee has one or more roles assigned
- Roles have scope limiting: self/team/department/organization
- Scope determines which resources the employee can access

### Permission Checking
- RBAC service checks effective permissions per employment_id
- `get_effective_permissions(employment_id)` → list ofachable actions
- Resource-level checks: can this employment READ employment resource?
- Action-level: can this employment CREATE leaves?

### Authorization Testing Scenarios

| Scenario | Description | Expected Behavior |
|----------|-------------|-------------------|
| Allowed actor | Super Admin or resource owner | 200 OK, operation succeeds |
| Unauthorized actor | No authentication | 401 Unauthorized |
| Insufficient permission | Authenticated regular user tries admin operation | 403 Forbidden or 404 Not Found |
| Wrong role | User with Standard role tries Super Admin operation | 403/404 |
| Resource owner | User accessing their own resources (self-scope) | 200 OK |
| Non-owner | User A accessing User B's resources (horizontal) | 403 Forbidden / 404 Not Found |
| Department access | User accessing resources within their department | 200 OK (if dept scope granted) |
| Organization access | Super Admin accessing all resources | 200 OK |
| Scope escalation | User trying to access beyond their scope | 403 Forbidden |

### Horizontal Access Control (Critical)

The application is particularly vulnerable to horizontal access control issues since many endpoints accept `employment_id` as a parameter but may not enforce ownership.

#### Test Patterns for Horizontal Access Control

```python
# Test: Regular employee cannot access another employee's resources

def test_cannot_access_another_employee_resources(
    client, super_admin_token, regular_employee_token
):
    # 1. Create two employees: emp_a and emp_b
    # 2. Emp A tries to GET /workforce/employees emp B's data
    # 3. Expected: 403 Forbidden or 404 Not Found
    
    response = client.get(
        "/workforce/employees",
        headers={"Authorization": f"Bearer {regular_employee_token}"},
        params={"employment_id": emp_b.id},  # or relevant filter
    )
    assert response.status_code in (403, 404)
```

#### Specific Endpoints Requiring Horizontal Access Control Tests
- GET /workforce/employments (filtered by employment_id)
- GET /workforce/persons (various filters)
- GET /my-work/leave/ (filtered by employment_id)
- GET /my-work/requests/ (filtered by employment_id)
- GET /leave/requests/ (filtered by requester_employment_id)
- GET /approvals/requests/ (filtered by requester_employment_id)
- GET /sales/leads/ (filtered by assigned_employment_id)
- GET /clients/ (various filters)
- POST /workforce/employees (if regular user can create)
- PATCH /workforce/employments/{id} (if regular user can update)

### Role-Based Access Tests

| Role | Typical Permissions | Test Focus |
|------|--------------------|------------|
| Super Admin (is_system_role=True) | All resources, all actions | Verify admin can do everything |
| Standard User (self-scope) | Own records only | Verify cannot access others' data |
| Department Manager | Department-scoped | Verify department boundary |
| HR Executive | Organization-scoped | Verify org-wide access |
| Sales Rep | Self/team on leads/clients | Verify sales module boundaries |

### Authorization Dependency Chain
```
get_current_login → gets employment_id
→ RBAC service checks effective permissions
→ Service layer enforces permission before business logic
→ Response or 403 Forbidden
```

### Authorization Testing Fixtures

```python
@pytest.fixture
def regular_user_employment_id():
    """Employment ID of regular user for permission checks."""

@pytest.fixture  
def super_admin_employment_id():
    """Employment ID 1 (system actor)."""

@pytest.fixture
def test_employee_2():
    """Second test employee for horizontal access tests."""

@pytest.mark.authorization
def test_regular_user_cannot_delete_another_employee(
    client, regular_user_token, db_session, test_employee_2
):
    # Regular user tries to DELETE another employee
    response = client.delete(
        f"/workforce/employees/{test_employee_2.id}",
        headers={"Authorization": f"Bearer {regular_user_token}"},
    )
    assert response.status_code == 403
```

### Permission Scoping Tests

```python
# Test: Department manager can access department resources but not org-wide

def test_dept_manager_scope(
    client, dept_manager_token, db_session
):
    # Dept manager token
    # Create resources in different departments
    # Manager should only see their own department's resources
    response = client.get("/workforce/employees", 
        headers={"Authorization": f"Bearer {dept_manager_token}"})
    # Verify only dept employees returned
```

### Sensitive Field Permission Tests

Some endpoints may hide fields based on role. Test that:
- Regular users don't see sensitive fields (salary, personal data)
- Super Admin sees all fields
- Appropriate fields are redacted based on role

## Cross-Referencing Authz with Endpoints

Endpoints that commonly have authorization requirements:

| Module | Endpoints with Authz |
|--------|---------------------|
| auth | All (public login/logout, protected change-password) |
| workforce/employee | CRUD on persons/positions/employments |
| rbac | All (role CRUD, permission grants) |
| admin/user | All user CRUD + deactivate/activate/lock/unlock/archive |
| leave/request | Submit, cancel, approve/reject requests |
| approvals/request | Create, list, approve, reject, cancel |
| payroll/employee_payroll | Employee list, bank accounts |
| my-work/leave | Submit, list, balances, types |
| my-work/attendance | Punch, breaks, corrections |
| sales/lead | CRUD on leads, status changes |
| project/project | CRUD on projects, tasks |
| project/task | CRUD on tasks, time entries |

## Authentication & Authorization Testing Summary

| Aspect | Approach |
|--------|----------|
| Auth fixture generation | JWT token generation via JWTManager |
| Valid token test | 200 on protected endpoints |
| Invalid/expired token test | 401 on protected endpoints |
| No credentials test | 401 on all protected endpoints |
| Horizontal access control | User A → User B's resources → 403/404 |
| Role-based tests | Each role type against each protected endpoint |
| Scope enforcement | Self/team/department/org boundaries |
| Sensitive field redaction | Verify fields hidden based on role |
| RBAC dependency chain | Trace from dependency → service → check → response |