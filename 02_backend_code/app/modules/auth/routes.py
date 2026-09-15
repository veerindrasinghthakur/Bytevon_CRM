"""Authentication HTTP routes — all ops via AuthService."""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Request, status

from app.modules.auth.dependencies import AuthServiceDep
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    RefreshRequest,
    ResetPasswordRequest,
    SessionResponse,
    TokenPairResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with email and password",
)
async def login(
    body: LoginRequest,
    service: AuthServiceDep,
    request: Request,
) -> LoginResponse:
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await service.login(body, ip_address=ip, user_agent=ua)


@router.post(
    "/refresh",
    response_model=TokenPairResponse,
    summary="Refresh access token",
)
async def refresh(
    body: RefreshRequest,
    service: AuthServiceDep,
) -> TokenPairResponse:
    return await service.refresh(body)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout (revoke current or all sessions)",
)
async def logout(
    service: AuthServiceDep,
    x_login_id: Annotated[int, Header(alias="X-Login-Id")],
    session_id: Optional[int] = None,
    revoke_all: bool = False,
) -> MessageResponse:
    return await service.logout(
        login_id=x_login_id, session_id=session_id, revoke_all=revoke_all
    )


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password (authenticated)",
)
async def change_password(
    body: ChangePasswordRequest,
    service: AuthServiceDep,
    x_login_id: Annotated[int, Header(alias="X-Login-Id")],
) -> MessageResponse:
    return await service.change_password(login_id=x_login_id, data=body)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request password reset email",
)
async def forgot_password(
    body: ForgotPasswordRequest,
    service: AuthServiceDep,
) -> MessageResponse:
    return await service.forgot_password(body)


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password with token",
)
async def reset_password(
    body: ResetPasswordRequest,
    service: AuthServiceDep,
) -> MessageResponse:
    return await service.reset_password(body)


@router.get(
    "/sessions",
    response_model=list[SessionResponse],
    summary="List active sessions for current user",
)
async def list_sessions(
    service: AuthServiceDep,
    x_login_id: Annotated[int, Header(alias="X-Login-Id")],
) -> list[SessionResponse]:
    return await service.list_sessions(x_login_id)
