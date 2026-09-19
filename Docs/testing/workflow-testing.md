# Workflow Testing

## Overview

Workflow tests verify important business processes that span multiple endpoints/modules. These are higher-level integration tests that validate end-to-end state changes.

## Identified Business Workflows

### 1. Create Employee Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /workforce/employees | Create person + employment; employee record in DB |
| 2 | POST /workforce/positions | Create position (optional) |
| 3 | POST /auth/login | Authenticate as the new employee |
| 4 | GET /my-work/leave/types | Verify leave types available |
| 5 | GET /my-work/attendance/today-info | Verify attendance setup |

**Starting state**: No employment record
**End state**: Employee exists with employment, can submit leave requests

---

### 2. Submit Leave Request Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /my-work/leave/ | Submit leave request; status = PENDING |
| 2 | GET /my-work/leave/ | List request; verify status PENDING |
| 3 | GET /leave/approvals/requests/pending | Manager sees pending request |
| 4 | POST /approvals/{id}/approve | Approve request; status = APPROVED |
| 5 | GET /my-work/leave/balances | Verify leave balance updated |

**Starting state**: Employee exists, leave policy exists
**End state**: Leave request approved, balance deducted

**Key dependencies**: 
- Employee must exist (workforce module)
- Leave policy must exist (leave module)
- Employee must have valid employment status

---

### 3. Cancel Leave Request Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /my-work/leave/ | Submit request (status PENDING) |
| 2 | POST /my-work/leave/{id}/cancel | Cancel request; status = CANCELLED |

**Starting state**: Pending leave request
**End state**: Request cancelled, balance not deducted

---

### 4. Approve/Reject Approval Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /approvals/requests/ | Create approval request (status PENDING) |
| 2 | GET /approvals/requests/pending | List pending requests |
| 3 | POST /approvals/{id}/approve | Approve request; status = APPROVED |
| 4 | OR POST /approvals/{id}/reject | Reject request; status = REJECTED |
| 5 | GET /approvals/requests/{id} | Verify final status |

**Starting state**: New approval request
**End state**: Request approved or rejected

**Also test**: 
- Repeated approve (should fail or be idempotent)
- Cancel after approve (may or may not be allowed depending on business rules)
- Comment on approval (POST /approvals/{id}/comment)

**Side effects may include**:
- Leave request status update (if leave-type request)
- Attendance record updates
- Notification sent

---

### 5. Payroll Approval Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /payroll/monthly_payroll/calculate | Calculate payroll (status = CALCULATED) |
| 2 | GET /payroll/kpis | View payroll metrics |
| 3 | POST /payroll/{payroll_id}/approve | Approve payroll; status = PAID |
| 4 | GET /payroll/{payroll_id} | Verify payroll marked as paid |

**Starting state**: Payroll run exists
**End state**: Payroll approved and marked as paid

**Also test**:
- Approve same payroll twice (idempotency or error)
- Approve without calculating (should error)
- KPIs reflect approved count

---

### 6. Employee State Transition Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /workforce/employees | Create employee (state = CONFIRMED) |
| 2 | POST /workforce/employments/{id}/state | Change employment state |
| 3 | Possible states: CONFIRMED → TERMINATED, on_leave, etc. |
| 4 | GET /workforce/employments/{id} | Verify state change |

**Starting state**: New employee (CONFIRMED)
**End state**: State transitioned per business rule

**Also test**:
- Invalid transition (e.g., TERMINATED → CONFIRMED)
- Repeated transition
- State history tracking

---

### 7. Attendance Punch Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /my-work/attendance/punch | Punch in; attendance day created/updated |
| 2 | POST /my-work/attendance/punch | Punch out; day total calculated |
| 3 | GET /my-work/attendance/week-hours | Verify weekly hours |
| 4 | GET /my-work/attendance/day/{id} | Verify day summary |

**Starting state**: New day, no punches
**End state**: Day has punch records, hours calculated

**Also test**:
- Punch without valid employment (error)
- Punch twice without punch out (may or may not be allowed)
- Break start/end within punch period

---

### 8. Create Project + Task Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /projects/ | Create project |
| 2 | POST /tasks/ | Create task linked to project |
| 3 | GET /projects/{id} | Verify project with task |
| 4 | POST /tasks/{task_id}/time-entries | Log time entries |
| 5 | GET /tasks/{task_id}/time-entries | Verify time entries |

**Starting state**: No project or tasks
**End state**: Project with tasks and time entries

---

### 9. Client + Contact Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /clients/ | Create client |
| 2 | POST /clients/{client_id}/contacts | Add contact to client |
| 3 | GET /clients/{client_id}/contacts | List contacts |
| 4 | PATCH /clients/{client_id} | Update client info |

**Starting state**: No client or contacts
**End state**: Client with associated contact(s)

---

### 10. Document Workflow

| Step | API Endpoint | Expected State Change |
|------|-------------|----------------------|
| 1 | POST /documents/ | Create document |
| 2 | POST /documents/{document_id}/versions | Add version |
| 3 | GET /documents/{document_id}/links | List links |
| 4 | POST /links | Link document to entity |
| 5 | GET /documents/{document_id} | Verify document with version |

**Starting state**: No documents
**End state**: Document with versions and links

---

## Workflow Test Structure

### General Pattern

```python
async def test_complete_workflow(client, db_session, auth_headers):
    """Example workflow test pattern."""
    
    # 1. Setup: Create required test data
    employee_data = {
        "person": {"first_name": "Workflow", "last_name": "Test"},
        "employment": {"employee_code": "WF-TST-001"},
    }
    # Use factories or direct DB ops to create data
    
    # 2. Execute: Run the workflow sequence
    # Create employee
    resp1 = client.post("/workforce/employees", json=employee_data, headers=auth_headers)
    assert resp1.status_code == 201
    emp_id = resp1.json()["id"]  # or relevant field
    
    # Submit leave request
    leave_data = {" ... "}
    resp2 = client.post("/my-work/leave/", json=leave_data, headers=auth_headers)
    assert resp2.status_code == 201
    req_id = resp2.json()["id"]
    
    # Approve request
    resp3 = client.post(f"/approvals/{req_id}/approve", headers=auth_headers)
    assert resp3.status_code == 200
    
    # 3. Verify: Check final state
    # Verify DB state
    async with db_session() as session:
        result = await session.get(LeaveRequest, req_id)
        assert result.status == ApprovalStatus.APPROVED
    
    # Verify API response
    assert resp3.json()["status"] == "approved"
```

### Workflow Test Isolation

- Each workflow test must be independently executable
- Clean up with per-test `TRUNCATE ... RESTART IDENTITY CASCADE` on the dedicated test DB (SERIAL; rollback alone is insufficient — see `implementation-plan.md` TASK-012/TASK-017)
- Don't depend on data from other workflow tests
- Create minimal required data; clean up after

### Workflow Test Markers

```python
# Mark workflow tests appropriately
@pytest.mark.workflow
def test_create_leave_approve_workflow(client, ...):
    ...

@pytest.mark.workflow
def test_payroll_approve_workflow(client, ...):
    ...
```

## Workflow Testing Priorities

| Priority | Workflow | Risk Level | Business Criticality |
|----------|----------|-----------|--------------------|
| P0 | Create employee → submit leave → approve | High | Core HR operation |
| P0 | Submit approval → approve/reject | High | Workflow engine |
| P1 | Payroll calculate → approve | Medium | Financial operation |
| P1 | Attendance punch → week hours | Medium | Ops operation |
| P2 | Project → tasks → time entries | Lower | Project management |
| P2 | Client → contacts | Lower | Sales operations |

## Workflow Testing Guidelines

1. **Start with P0 workflows** (highest business criticality)
2. **Test database state after each workflow** (not just API responses)
3. **Verify side effects** (balance updates, status changes, related record changes)
4. **Test error cases within workflows** (invalid transition, missing dependency)
5. **Test idempotency** (repeated calls should not corrupt state)
6. **Test error recovery** (what happens when a step fails mid-workflow)
7. **Keep workflow tests independent** (no shared state between tests)
8. **Use fixtures for common data** (employee, role, policy)
9. **Document expected state at each step**
10. **Prioritize workflows that cross module boundaries**