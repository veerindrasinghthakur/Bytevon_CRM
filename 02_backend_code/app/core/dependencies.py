"""
Shared FastAPI dependencies — JWT current user / employment.

Modules should prefer these over ad-hoc X-Employment-Id headers for protected routes.
X-Employment-Id remains useful for system/admin tooling and development.
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security.jwt_manager import JWTManager
from app.core.security.token_payload import TokenPayload
from app.modules.authentication.models import Login, Session
from app.modules.authentication.repositories.repository import AuthenticationRepository

_bearer = HTTPBearer(auto_error=False)
_jwt = JWTManager()


async def get_token_payload(
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials], Depends(_bearer)
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
    x_employment_id: Annotated[Optional[int], Header(alias="X-Employment-Id")] = None,
) -> int:
    """
    Prefer JWT employment_id; allow X-Employment-Id override for multi-employment
    contexts when the claim is absent.
    """
    emp_id = payload.employment_id or x_employment_id
    if emp_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="employment_id not present in token; supply X-Employment-Id",
        )
    return emp_id


async def get_optional_employment_id(
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials], Depends(_bearer)
    ] = None,
    x_employment_id: Annotated[Optional[int], Header(alias="X-Employment-Id")] = None,
) -> Optional[int]:
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
OptionalEmploymentIdDep = Annotated[Optional[int], Depends(get_optional_employment_id)]
