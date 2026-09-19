"""
Shared FastAPI dependencies — JWT current user / employment.

Modules should prefer these over ad-hoc X-Employment-Id headers for protected routes.
X-Employment-Id remains useful for system/admin tooling and development.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security.jwt_manager import JWTManager
from app.core.security.token_payload import TokenPayload
from app.modules.auth.models import Login
from app.modules.auth.repository import AuthenticationRepository
from app.modules.workforce.models import Employment

_bearer = HTTPBearer(auto_error=False)
_jwt = JWTManager()


async def get_token_payload(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer)
    ],
) -> TokenPayload:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = _jwt.decode_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    if payload.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required",
        )
    return payload


async def get_current_login(
    payload: Annotated[TokenPayload, Depends(get_token_payload)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Login:
    repo = AuthenticationRepository(session)
    login = await repo.get_login_by_id(payload.login_id)
    if login is None or not getattr(login, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login inactive or not found",
        )
    return login


async def get_current_employment_id(
    payload: Annotated[TokenPayload, Depends(get_token_payload)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    x_employment_id: Annotated[int | None, Header(alias="X-Employment-Id")] = None,
) -> int:
    """
    Resolve the caller employment.

    JWT employment_id wins when no override is supplied. A supplied
    X-Employment-Id is honored ONLY when it belongs to the JWT person's
    employments (multi-employment switching); otherwise 403.
    """
    if payload.employment_id is not None and x_employment_id in (None, payload.employment_id):
        return payload.employment_id
    if x_employment_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="employment_id not present in token; supply X-Employment-Id",
        )
    rows = (
        await session.execute(
            select(Employment.id).where(Employment.person_id == payload.person_id)
        )
    ).scalars().all()
    if x_employment_id not in set(rows):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="X-Employment-Id does not belong to the authenticated user",
        )
    return x_employment_id


async def get_optional_employment_id(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer)
    ] = None,
    x_employment_id: Annotated[int | None, Header(alias="X-Employment-Id")] = None,
) -> int | None:
    """Best-effort actor resolution; does not fail if unauthenticated."""
    if credentials and credentials.credentials:
        try:
            payload = _jwt.decode_token(credentials.credentials)
            if payload.employment_id:
                return payload.employment_id
        except Exception:
            pass
    return x_employment_id


# Annotated shortcuts
TokenPayloadDep = Annotated[TokenPayload, Depends(get_token_payload)]
CurrentLoginDep = Annotated[Login, Depends(get_current_login)]
CurrentEmploymentIdDep = Annotated[int, Depends(get_current_employment_id)]
OptionalEmploymentIdDep = Annotated[int | None, Depends(get_optional_employment_id)]
