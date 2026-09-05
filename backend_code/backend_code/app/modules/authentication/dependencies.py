"""
FastAPI dependencies for Authentication module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security.jwt_manager import JWTManager
from app.core.security.password_manager import PasswordManager
from app.modules.authentication.services.public_service import AuthenticationPublicService


def get_authentication_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthenticationPublicService:
    return AuthenticationPublicService(
        session,
        jwt_manager=JWTManager(),
        password_manager=PasswordManager(),
    )


AuthenticationServiceDep = Annotated[
    AuthenticationPublicService, Depends(get_authentication_public_service)
]
