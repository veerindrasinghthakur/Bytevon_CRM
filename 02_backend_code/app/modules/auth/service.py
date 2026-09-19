"""
AuthService — only public entry point for Auth.

Owns the transaction. After successful commit, audit (and later notification)
are invoked best-effort; their failure must not roll back business work.
"""

from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import (
    EmploymentState,
    SessionRevokeReason,
    SessionStatus,
)
from app.core.security.jwt_manager import JWTManager
from app.core.security.password_manager import PasswordManager
from app.core.services.base_public_service import BasePublicService
from app.modules.auth.exceptions import (
    AccountInactiveException,
    AccountLockedException,
    InvalidCredentialsException,
    InvalidPasswordResetTokenException,
    InvalidSessionException,
    PasswordResetAlreadyUsedException,
    SessionExpiredException,
    SessionRevokedException,
)
from app.modules.auth.models import Login, PasswordResetToken, Session
from app.modules.auth.repository import AuthRepository
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
from app.modules.workforce.models import Employment

logger = logging.getLogger(__name__)


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


_TERMINAL_EMPLOYMENT_STATES = frozenset(
    {
        EmploymentState.RESIGNED,
        EmploymentState.TERMINATED,
        EmploymentState.ALUMNI,
    }
)


async def _resolve_primary_employment_id(session: AsyncSession, person_id: int) -> int | None:
    """Primary employment for JWT claims: first non-terminal, else first, else None."""
    from sqlalchemy import select

    rows = (
        await session.execute(
            select(Employment).where(Employment.person_id == person_id).order_by(Employment.id)
        )
    ).scalars().all()
    if not rows:
        return None
    for emp in rows:
        if emp.current_state not in _TERMINAL_EMPLOYMENT_STATES:
            return emp.id
    return rows[0].id


class AuthService(BasePublicService):
    def __init__(
        self,
        session: AsyncSession,
        *,
        jwt_manager: JWTManager | None = None,
        password_manager: PasswordManager | None = None,
    ) -> None:
        super().__init__(session)
        self._repo = AuthRepository(session)
        self._jwt = jwt_manager or JWTManager()
        self._pwd = password_manager or PasswordManager()

    async def login(
        self,
        data: LoginRequest,
        *,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> LoginResponse:
        now = datetime.now(UTC)

        login = await self._repo.get_login_by_email(data.email)
        if login is None:
            self._pwd.verify("dummy", self._pwd.hash("dummy"))
            raise InvalidCredentialsException()

        if not login.is_active:
            raise AccountInactiveException()

        if login.locked_until and login.locked_until > now:
            raise AccountLockedException(locked_until=login.locked_until.isoformat())

        if not self._pwd.verify(data.password, login.password_hash):
            await self._record_failed_attempt(login, now)
            raise InvalidCredentialsException()

        login.failed_attempt_count = 0
        login.locked_until = None

        session_row = Session(
            login_id=login.id,
            refresh_token_hash="",
            device_name=data.device_name,
            device_type=data.device_type,
            ip_address=ip_address,
            user_agent=user_agent,
            status=SessionStatus.ACTIVE,
            expires_at=now + self._jwt.refresh_expires_delta,
            last_used_at=now,
        )
        await self._repo.add(session_row)
        await self._flush()

        refresh_token = self._jwt.generate_refresh_token(
            login_id=login.id,
            person_id=login.person_id,
            session_id=session_row.id,
            employment_id=await _resolve_primary_employment_id(self._session, login.person_id),
        )
        session_row.refresh_token_hash = _hash_token(refresh_token)

        primary_employment_id = await _resolve_primary_employment_id(
            self._session, login.person_id
        )
        access_token = self._jwt.generate_access_token(
            login_id=login.id,
            person_id=login.person_id,
            employment_id=primary_employment_id,
        )

        await self._commit()
        await self._audit_login_success(login.id)

        return LoginResponse(
            tokens=TokenPairResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            ),
            login_id=login.id,
            person_id=login.person_id,
            employment_id=primary_employment_id,
            email=login.email,
        )

    async def _record_failed_attempt(self, login: Login, now: datetime) -> None:
        login.failed_attempt_count = (login.failed_attempt_count or 0) + 1
        if login.failed_attempt_count >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            login.locked_until = now + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
        await self._commit()

    async def refresh(self, data: RefreshRequest) -> TokenPairResponse:
        now = datetime.now(UTC)
        payload = self._jwt.decode_refresh_token(data.refresh_token)

        session_row = await self._repo.get_session_by_id(int(payload.jti or 0))
        if session_row is None:
            raise InvalidSessionException()

        if session_row.status == SessionStatus.REVOKED:
            raise SessionRevokedException()
        if session_row.status == SessionStatus.EXPIRED or session_row.expires_at < now:
            raise SessionExpiredException()

        if session_row.refresh_token_hash != _hash_token(data.refresh_token):
            raise InvalidSessionException()

        login = await self._repo.get_login_by_id(session_row.login_id)
        if login is None or not login.is_active:
            raise AccountInactiveException()

        new_refresh = self._jwt.generate_refresh_token(
            login_id=login.id,
            person_id=login.person_id,
            session_id=session_row.id,
            employment_id=await _resolve_primary_employment_id(self._session, login.person_id),
        )
        session_row.refresh_token_hash = _hash_token(new_refresh)
        session_row.last_used_at = now

        access_token = self._jwt.generate_access_token(
            login_id=login.id,
            person_id=login.person_id,
            employment_id=await _resolve_primary_employment_id(self._session, login.person_id),
        )

        await self._commit()

        return TokenPairResponse(
            access_token=access_token,
            refresh_token=new_refresh,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(
        self,
        *,
        login_id: int,
        session_id: int | None = None,
        revoke_all: bool = False,
    ) -> MessageResponse:
        now = datetime.now(UTC)
        if revoke_all:
            await self._repo.revoke_sessions(
                login_id=login_id,
                reason=SessionRevokeReason.USER_LOGOUT.value,
                now=now,
            )
        elif session_id is not None:
            await self._repo.revoke_sessions(
                login_id=login_id,
                reason=SessionRevokeReason.USER_LOGOUT.value,
                session_ids=[session_id],
                now=now,
            )
        else:
            raise InvalidSessionException()

        await self._commit()
        await self._audit_logout(login_id)
        return MessageResponse(message="Logged out successfully")

    async def revoke_session(
        self, *, actor_login_id: int, session_id: int
    ) -> MessageResponse:
        session_row = await self._repo.get_session_by_id(session_id)
        if session_row is None or session_row.login_id != actor_login_id:
            from app.core.exceptions.exception import NotFoundError

            raise NotFoundError("Session not found")

        await self._repo.revoke_sessions(
            login_id=actor_login_id,
            reason=SessionRevokeReason.USER_LOGOUT.value,
            session_ids=[session_id],
        )
        await self._commit()
        return MessageResponse(message="Session revoked")

    async def change_password(
        self, *, login_id: int, data: ChangePasswordRequest
    ) -> MessageResponse:
        login = await self._repo.get_login_by_id(login_id)
        if login is None:
            raise InvalidCredentialsException()

        if not self._pwd.verify(data.current_password, login.password_hash):
            raise InvalidCredentialsException()

        login.password_hash = self._pwd.hash(data.new_password)
        login.failed_attempt_count = 0
        login.locked_until = None

        if data.revoke_all_sessions:
            await self._repo.revoke_sessions(
                login_id=login_id,
                reason=SessionRevokeReason.PASSWORD_CHANGED.value,
            )

        await self._commit()
        return MessageResponse(message="Password changed successfully")

    async def forgot_password(self, data: ForgotPasswordRequest) -> MessageResponse:
        login = await self._repo.get_login_by_email(data.email)
        if login and login.is_active:
            raw_token = secrets.token_urlsafe(32)
            token_hash = _hash_token(raw_token)
            expires = datetime.now(UTC) + timedelta(
                minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
            )
            reset = PasswordResetToken(
                login_id=login.id,
                token_hash=token_hash,
                expires_at=expires,
            )
            await self._repo.add(reset)
            await self._commit()
            logger.info("Password reset token generated for login_id=%s", login.id)

        return MessageResponse(
            message="If an account with that email exists, a reset link has been sent"
        )

    async def reset_password(self, data: ResetPasswordRequest) -> MessageResponse:
        now = datetime.now(UTC)
        token_hash = _hash_token(data.token)
        reset = await self._repo.get_valid_reset_token(token_hash, now)

        if reset is None:
            raise InvalidPasswordResetTokenException()
        if reset.is_used:
            raise PasswordResetAlreadyUsedException()

        login = await self._repo.get_login_by_id(reset.login_id)
        if login is None or not login.is_active:
            raise InvalidPasswordResetTokenException()

        login.password_hash = self._pwd.hash(data.new_password)
        login.failed_attempt_count = 0
        login.locked_until = None

        reset.is_used = True
        reset.used_at = now

        await self._repo.revoke_sessions(
            login_id=login.id,
            reason=SessionRevokeReason.PASSWORD_CHANGED.value,
            now=now,
        )

        await self._commit()
        return MessageResponse(message="Password has been reset successfully")

    async def list_sessions(self, login_id: int) -> list[SessionResponse]:
        rows = await self._repo.get_active_sessions_for_login(login_id)
        return [SessionResponse.model_validate(r) for r in rows]

    async def _audit_login_success(self, login_id: int) -> None:
        await self._audit(
            "login.login", login_id, description="Employee logged in successfully"
        )

    async def _audit_logout(self, login_id: int) -> None:
        await self._audit("login.logout", login_id, description="Employee logged out")


# Back-compat
AuthenticationPublicService = AuthService
