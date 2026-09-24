"""Scope-aware leave request operations (ScopeResolver + adapters)."""
from __future__ import annotations

from typing import Optional

from app.core.db.enums import LeaveRequestStatus
from app.core.exceptions.exception import ForbiddenError, NotFoundError
from app.modules.leave.request.schemas import LeaveRequestCreate, LeaveRequestResponse
from app.modules.leave.request.service import RequestService
from app.modules.rbac.scoping.resolver import ScopeResolver
from app.modules.rbac.scoping.validate_create import validate_create_payload


async def list_requests_scoped(
    service: RequestService,
    *,
    actor_employment_id: int,
    is_super_admin: bool = False,
    employment_id: Optional[int] = None,
    status: Optional[LeaveRequestStatus] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[LeaveRequestResponse]:
    constraint = None
    if not is_super_admin:
        constraint = await ScopeResolver(service._session).resolve(
            actor_employment_id, "leave_request", "VIEW"
        )
        if constraint is None:
            raise ForbiddenError(
                "You don't have permission to perform this action",
                code="insufficient_permission",
            )
    rows = await service._repo.list_requests(
        employment_id=employment_id,
        status=status,
        limit=limit,
        offset=offset,
        constraint=constraint,
    )
    codes = await service._types.code_map_for({r.leave_type_id for r in rows})
    return [service._to_response(r, codes.get(r.leave_type_id, "?")) for r in rows]


async def get_request_scoped(
    service: RequestService,
    request_id: int,
    *,
    actor_employment_id: int,
    is_super_admin: bool = False,
) -> LeaveRequestResponse:
    constraint = None
    if not is_super_admin:
        constraint = await ScopeResolver(service._session).resolve(
            actor_employment_id, "leave_request", "VIEW"
        )
        if constraint is None:
            raise ForbiddenError(
                "You don't have permission to perform this action",
                code="insufficient_permission",
            )
    req = await service._repo.get_request_by_id(request_id, constraint=constraint)
    if req is None:
        raise NotFoundError("Leave request not found")
    codes = await service._types.code_map_for({req.leave_type_id})
    return service._to_response(req, codes.get(req.leave_type_id, "?"))


async def cancel_request_scoped(
    service: RequestService,
    request_id: int,
    *,
    actor_employment_id: int,
    is_super_admin: bool = False,
) -> LeaveRequestResponse:
    constraint = None
    if not is_super_admin:
        constraint = await ScopeResolver(service._session).resolve(
            actor_employment_id, "leave_request", "UPDATE"
        )
        if constraint is None:
            raise ForbiddenError(
                "You don't have permission to perform this action",
                code="insufficient_permission",
            )
    req = await service._repo.get_request_by_id(request_id, constraint=constraint)
    if req is None:
        raise NotFoundError("Leave request not found")
    return await service.cancel_request(request_id, actor_employment_id=actor_employment_id)


async def submit_request_scoped(
    service: RequestService,
    data: LeaveRequestCreate,
    *,
    actor_employment_id: int,
    is_super_admin: bool = False,
) -> LeaveRequestResponse:
    if not is_super_admin:
        allowed = await ScopeResolver(service._session).scope_for_create(
            actor_employment_id, "leave_request"
        )
        validate_create_payload(
            allowed,
            employment_id=data.employment_id,
            department_id=data.target_department_id,
        )
    return await service.submit_request(data, actor_employment_id=actor_employment_id)
