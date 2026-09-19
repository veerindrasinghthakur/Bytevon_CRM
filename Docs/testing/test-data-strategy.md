# Test Data Strategy

## Overview

Design a reusable test data strategy for the ByteVon CRM application. Avoid a system where hundreds of tests independently construct large objects manually. Instead, create reusable factories/fixtures for domain entities.

## Design Principles

| Principle | Rationale |
|-----------|-----------|
| Reusable | Factories can be reused across test files and modules |
| Deterministic | Same inputs produce same output; no randomness |
| Isolated | Tests don't share mutable state; each test gets fresh data |
| Maintainable | Changing a field definition updates all tests using the factory |
| Controlled | Tests can generate valid or invalid data as needed |

## Base Factories/Fixtures

### User / Login / Person

| Entity | Fields | Defaults | Overridable |
|--------|--------|----------|-------------|
| Person | first_name, last_name | Generated from sample list | Any field |
| Login | person_id, email, password_hash | Seed data: asha.patel@example.com | email, is_active |
| Employment | person_id, employee_code, state | Seed data: EMP-002, CONFIRMED | employee_code, joining_date |

### Example Factory Pattern

```python
# tests/factories.py
# Deterministic: NO random module. Uniqueness via run/worker counter.
import os
import threading
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.workforce.employee.schemas import PersonCreate, EmploymentCreate
from app.modules.auth.models import Person as PersonModel
from app.modules.workforce.models import Employment


class FactoryCounter:
    _counter = 0
    _lock = threading.Lock()
    _run_id = int(os.environ.get("PYTEST_RUN_ID", "0"))
    _worker_id = int(os.environ.get("PYTEST_WORKER_ID", "0"))

    @classmethod
    def next(cls) -> int:
        with cls._lock:
            cls._counter += 1
            return (cls._run_id << 40) | (cls._worker_id << 32) | cls._counter


async def person_factory(
    session: AsyncSession,
    first_name: str | None = None,
    last_name: str | None = None,
    email: str | None = None,
) -> PersonModel:
    """Create a person with optional field overrides."""
    n = FactoryCounter.next()
    fn = first_name or f"Test{n}"
    ln = last_name or f"User{n}"
    email = email or f"{fn.lower()}.{ln.lower()}.{n}@test.com"
    
    # Check if person already exists
    result = await session.execute(
        select(PersonModel).where(
            PersonModel.first_name == fn, PersonModel.last_name == ln
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    
    person = PersonModel(first_name=fn, last_name=ln)
    session.add(person)
    await session.flush()
    return person


async def employment_factory(
    session: AsyncSession,
    person: PersonModel,
    employee_code: str | None = None,
    state: str | None = None,
) -> Employment:
    """Create an employment for a given person."""
    ec = employee_code or f"EMP-{FactoryCounter.next():08d}"
    st = state or "CONFIRMED"
    
    emp = Employment(
        person_id=person.id,
        employee_code=ec,
        current_state=st,
        joining_date=date.today(),
    )
    session.add(emp)
    await session.flush()
    return emp
```

### Role Factory

```python
async def role_factory(
    session: AsyncSession,
    name: str = "Standard User",
    is_system_role: bool = False,
) -> Role:
    """Create a role with optional overrides."""
    result = await session.execute(select(Role).where(Role.name == name))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    
    role = Role(name=name, description=f"{name} role", is_system_role=is_system_role)
    session.add(role)
    await session.flush()
    return role
```

### Permission Factory

```python
async def permission_factory(
    session: AsyncSession,
    resource: Resource,
    action: Action,
) -> Permission:
    """Create a permission for a resource + action combo."""
    result = await session.execute(
        select(Permission).where(Permission.resource_id == resource.id, Permission.action == action)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    
    perm = Permission(resource_id=resource.id, action=action)
    session.add(perm)
    await session.flush()
    return perm
```

## Authenticated-User Fixtures

| Fixture | Description |
|---------|-------------|
| `regular_user` | Employee with Standard role, self-scoped permissions (capture generated `employment.id`; never assume an ID) |
| `super_admin` | Employment with Super Admin role, full access per Super Admin Contract (capture generated `employment.id`; never assume `id == 1`) |
| `department_manager` | Manager role, department-scoped permissions |
| `team_lead` | Role with team-scope permissions |
| `regular_employee` | Employee with self-scoped permissions only |

## Role Fixtures

| Role Name | Scopes | Typical Use |
|-----------|--------|-------------|
| Super Admin | organization | Admin tests, system integration |
| Standard User | self | Employee self-service, personal data |
| Department Manager | department | Manager-level operations |
| HR Executive | organization | HR-wide operations |
| Sales Rep | self/team | Sales module operations |

## Related Entity Creation

Factories should automatically create related entities when needed:

```python
# When creating a leave request, automatically create:
# - Employee with role
# - Leave policy (if not exists)
# - Current working week/shift/location

# When creating an approval request, automatically create:
# - Employee
# - Leave request or attendance correction
# - Assigned approver (manager)
```

## Invalid Entity Generation

```python
# Factory methods for invalid data (validation testing)
async def person_invalid_first_null(session) -> PersonCreate:
    """Person with null first_name (will trigger 422)."""
    return PersonCreate(first_name=None, last_name="TestUser")

async def person_invalid_email_format(session) -> LoginCreate:
    """Login with malformed email."""
    return LoginCreate(email="not-an-email", password_hash="hash")

async def employment_invalid_state(session) -> EmploymentCreate:
    """Employment with invalid state enum value."""
    return EmploymentCreate(current_state="INVALID_STATE")
```

## Conflict Data

```python
# Factory methods for conflict testing
async def duplicate_person_factory(session, first_name="Test", last_name="User") -> PersonCreate:
    """Returns person data that may trigger duplicate constraint."""
    return PersonCreate(first_name=first_name, last_name=last_name)

async def same_email_factory(session, email="existing@test.com") -> LoginCreate:
    """Returns login data with email that already exists."""
    return LoginCreate(email=email, password_hash="hash")
```

## Boundary Data

```python
# Boundary value testing data
async def pagination_boundary_factory(session) -> dict:
    """Return pagination parameters at boundary values."""
    return {
        "limit": [1, 500, 501],  # min, default, max+1
        "offset": [0, 100, 9999],  # typical values
    }

async def numeric_boundary_factory(session) -> dict:
    """Return numeric query params at boundary values."""
    return {
        "limit": [0, 1, 499, 500, 501],  # edge values
        "offset": [0, -1, 1],  # edge values
    }
```

## Workflow Data

```python
# Factory for complete workflow test data
async def full_employee_workflow_factory(session) -> dict:
    """Creates complete test data for employee-related workflows."""
    from app.modules.auth.models import Login, Person
    from app.modules.workforce.models import Employment, Position
    from app.modules.rbac.models import Role, EmployeeRole, Permission, Resource, Scope
    from sqlalchemy import select
    
    # Create person
    person = Person(first_name="Workflow", last_name="Test")
    session.add(person)
    await session.flush()
    
    # Create login
    from app.core.security.password_manager import PasswordManager
    pwd = PasswordManager()
    login = Login(
        person_id=person.id,
        email="workflow.test@example.com",
        password_hash=pwd.hash("TestPass123!"),
        is_active=True,
    )
    session.add(login)
    await session.flush()
    
    # Create employment
    emp = Employment(
        person_id=person.id,
        employee_code="WF-TST-001",
        employment_type="FULL_TIME",
        current_state="CONFIRMED",
        joining_date=date.today(),
    )
    session.add(emp)
    await session.flush()
    
    # Create position
    pos = await session.execute(select(Position).limit(1))
    pos = pos.scalar_one()
    
    # Assign role
    role = await session.execute(select(Role).limit(1))
    role = role.scalar_one()
    er = EmployeeRole(employment_id=emp.id, role_id=role.id)
    session.add(er)
    await session.flush()
    
    return {
        "person": person,
        "login": login,
        "employment": emp,
        "position": pos,
        "role": role,
    }
```

## Test Data Initialization Sequence

1. **Module-level fixtures**: Create minimal data needed for a module (e.g., employee + role for workforce tests)
2. **Function-level fixtures**: Create data specific to a test function, rolled back after
3. **Workflow fixtures**: Create complete data sets for multi-endpoint workflows
4. **Shared seed data**: Reuse seed_bootstrap.py data where applicable (admin, sample staff)

## Data Isolation Strategy

| Isolation Method | Description |
|-----------------|-------------|
| Transaction rollback | Begin transaction before test, rollback after — INSUFFICIENT alone (background `AsyncSessionLocal()` sessions bypass it); use dedicated test DB + SERIAL + per-test `TRUNCATE ... RESTART IDENTITY CASCADE` |
| Session-per-test | Each test gets its own AsyncSession |
| Savepoints | Nested savepoints for related operations |
| Database schema per test isolation | Separate test database or schema |

## Recommended Factory Library

Consider using **pydantic-factories** or **factory-boy** (adapted for async SQLAlchemy):

```python
# pydantic-factories example
from pydantic_factories import ModelFactory

class PersonFactory(ModelFactory):
    model = Person
    first_name: str = "TestPerson"
    last_name: str = "Default"
    
    class Meta:
        session = async_session  # SQLAlchemy session
```

## Data Strategy Summary

| Goal | Approach |
|------|----------|
| Avoid duplicate data creation | Shared factories across test files |
| Ensure test repeatability | Deterministic defaults; overridable fields |
| Minimize test setup boilerplate | Module-level and function-level fixtures |
| Support validation testing | Invalid data generators |
| Support conflict testing | Duplicate/constraint violation data |
| Support workflow testing | Complete entity graphs |
| Keep tests isolated | Rollback after each test; no shared mutable state |