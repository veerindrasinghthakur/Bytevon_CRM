"""Scope-aware employment operations (ScopeResolver + adapters).

Keeps large EmployeeService intact; routes call these helpers.
All employment API responses go through rbac.serialization.filter_response.
"""
from __future__ import annotations

from typing import Optional

from app.core.db.enums import EmploymentState
from app.core.exceptions.exception import ForbiddenError, NotFoundError
from app.modules.auth.models import Person
from app.modules.rbac.scoping.resolver import ScopeResolver
from app.modules.rbac.scoping.validate_create import validate_create_payload
from app.modules.rbac.serialization import filter_response
from app.modules.workforce.employee.schemas import (
    EmployeeCreate,
    EmploymentAssignmentResponse,
    EmploymentCreate,
    EmploymentDetailResponse,
    EmploymentResponse,
    EmploymentStateHistoryResponse,
    EmploymentUpdate,
    PersonResponse,
)
from app.modules.workforce.employee.service import EmployeeService, _optional_id

RESOURCE = "employment"


async def _redact(service: EmployeeService, actor_id: int, payload, *, is_super_admin: bool):
    return await filter_response(
        service._session,
        actor_employment_id=actor_id,
        resource=RESOURCE,
        payload=payload,
        is_super_admin=is_super_admin,
    )


async def list_employments_scoped(
    service: EmployeeService,
    *,
    actor_employment_id: int,
    is_super_admin: bool = False,
    state: Optional[EmploymentState] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[EmploymentResponse]:
    constraint = None
    if not is_super_admin:
        constraint = await ScopeResolver(service._session).resolve(
            actor_employment_id, RESOURCE, "VIEW"
        )
        if constraint is None:
            raise ForbiddenError(
                "You don't have permission to perform this action",
                code="insufficient_permission",
            )
    rows = await service._repo.list_employments(
        state=state.value if state else None,
        limit=limit,
        offset=offset,
        constraint=constraint,
    )
    resps = [EmploymentResponse.model_validate(r) for r in rows]
    names = await service._person_names({r.person_id for r in rows})
    displays = await service._assignment_display([r.id for r in rows])
    for resp, row in zip(resps, rows):
        service._apply_display(resp, names.get(row.person_id), displays.get(row.id))
    return await _redact(
        service, actor_employment_id, resps, is_super_admin=is_super_admin
    )


async def get_employment_scoped(
    service: EmployeeService,
    employment_id: int,
    *,
    actor_employment_id: int,
    is_super_admin: bool = False,
) -> EmploymentDetailResponse:
    constraint = None
    if not is_super_admin:
        constraint = await ScopeResolver(service._session).resolve(
            actor_employment_id, RESOURCE, "VIEW"
        )
        if constraint is None:
            raise ForbiddenError(
                "You don't have permission to perform this action",
                code="insufficient_permission",
            )
    emp = await service._repo.get_employment_by_id(
        employment_id, with_relations=True, constraint=constraint
    )
    if emp is None:
        raise NotFoundError("Employment not found")
    current_asg = await service._repo.get_current_assignment(employment_id)
    history = await service._repo.list_state_history(employment_id, limit=10)
    person = await service._session.get(Person, emp.person_id)
    detail = EmploymentDetailResponse(
        **EmploymentResponse.model_validate(emp).model_dump(),
        current_assignment=(
            EmploymentAssignmentResponse.model_validate(current_asg) if current_asg else None
        ),
        recent_state_history=[
            EmploymentStateHistoryResponse.model_validate(h) for h in history
        ],
        person=PersonResponse.model_validate(person) if person else None,
    )
    return await _redact(
        service, actor_employment_id, detail, is_super_admin=is_super_admin
    )


async def update_employment_scoped(
    service: EmployeeService,
    employment_id: int,
    data: EmploymentUpdate,
    *,
    actor_employment_id: int,
    is_super_admin: bool = False,
) -> EmploymentResponse:
    constraint = None
    if not is_super_admin:
        constraint = await ScopeResolver(service._session).resolve(
            actor_employment_id, RESOURCE, "UPDATE"
        )
        if constraint is None:
            raise ForbiddenError(
                "You don't have permission to perform this action",
                code="insufficient_permission",
            )
    emp = await service._repo.get_employment_by_id(
        employment_id, constraint=constraint
    )
    if emp is None:
        raise NotFoundError("Employment not found")
    resp = await service.update_employment(
        employment_id, data, actor_employment_id=actor_employment_id
    )
    return await _redact(
        service, actor_employment_id, resp, is_super_admin=is_super_admin
    )


async def create_employee_scoped(
    service: EmployeeService,
    data: EmployeeCreate,
    *,
    actor_employment_id: int,
    is_super_admin: bool = False,
) -> EmploymentDetailResponse:
    if not is_super_admin:
        allowed = await ScopeResolver(service._session).scope_for_create(
            actor_employment_id, RESOURCE
        )
        validate_create_payload(
            allowed,
            department_id=_optional_id(data.department_id),
            location_id=_optional_id(data.location_id),
        )
    detail = await service.create_employee(data, actor_employment_id=actor_employment_id)
    return await _redact(
        service, actor_employment_id, detail, is_super_admin=is_super_admin
    )


async def create_employment_scoped(
    service: EmployeeService,
    data: EmploymentCreate,
    *,
    actor_employment_id: int,
    is_super_admin: bool = False,
) -> EmploymentDetailResponse:
    if not is_super_admin:
        allowed = await ScopeResolver(service._session).scope_for_create(
            actor_employment_id, RESOURCE
        )
        validate_create_payload(
            allowed,
            department_id=_optional_id(data.department_id),
            location_id=_optional_id(data.location_id),
        )
    detail = await service.create_employment(data, actor_employment_id=actor_employment_id)
    return await _redact(
        service, actor_employment_id, detail, is_super_admin=is_super_admin
    )
