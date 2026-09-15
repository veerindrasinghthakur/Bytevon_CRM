"""FastAPI dependencies for Authentication module."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security.jwt_manager import JWTManager
from app.core.security.password_manager import PasswordManager
from app.modules.auth.service import AuthService


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthService:
    return AuthService(
        session,
        jwt_manager=JWTManager(),
        password_manager=PasswordManager(),
    )


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
# Back-compat
AuthenticationServiceDep = AuthServiceDep
