"""
AuthenticationRepository — domain-specific queries only.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db.enums import SessionStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.auth.models import Login, PasswordResetToken, Person, Session


class AuthenticationRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Person / Login
    # ------------------------------------------------------------------

    async def get_login_by_email(self, email: str) -> Optional[Login]:
        stmt = (
            select(Login)
            .where(Login.email == email)
            .options(selectinload(Login.person))
        )
        return await self.scalar_one_or_none(stmt)

    async def get_login_by_id(self, login_id: int) -> Optional[Login]:
        stmt = (
            select(Login)
            .where(Login.id == login_id)
            .options(selectinload(Login.person))
        )
        return await self.scalar_one_or_none(stmt)

    async def get_person_by_id(self, person_id: int) -> Optional[Person]:
        stmt = select(Person).where(Person.id == person_id)
        return await self.scalar_one_or_none(stmt)

    # ------------------------------------------------------------------
    # Sessions
    # ------------------------------------------------------------------

    async def get_session_by_id(self, session_id: int) -> Optional[Session]:
        stmt = select(Session).where(Session.id == session_id)
        return await self.scalar_one_or_none(stmt)

    async def get_active_sessions_for_login(self, login_id: int) -> Sequence[Session]:
        stmt = select(Session).where(
            Session.login_id == login_id,
            Session.status == SessionStatus.ACTIVE,
        )
        return await self.scalars(stmt)

    async def revoke_sessions(
        self,
        *,
        login_id: int,
        reason: str,
        session_ids: Optional[Sequence[int]] = None,
        now: Optional[datetime] = None,
    ) -> None:
        """
        Mark sessions as REVOKED. If session_ids is None, revoke all active for login.
        """
        from app.core.db.enums import SessionRevokeReason

        now = now or datetime.utcnow()
        stmt = (
            update(Session)
            .where(
                Session.login_id == login_id,
                Session.status == SessionStatus.ACTIVE,
            )
            .values(
                status=SessionStatus.REVOKED,
                revoked_reason=SessionRevokeReason(reason),
                revoked_at=now,
            )
        )
        if session_ids is not None:
            stmt = stmt.where(Session.id.in_(list(session_ids)))
        await self.execute(stmt)

    # ------------------------------------------------------------------
    # Password reset tokens
    # ------------------------------------------------------------------

    async def get_valid_reset_token(
        self, token_hash: str, now: datetime
    ) -> Optional[PasswordResetToken]:
        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.is_used.is_(False),
            PasswordResetToken.expires_at > now,
        )
        return await self.scalar_one_or_none(stmt)
