"""
JWT generation and verification (python-jose).

Access tokens are short-lived and not stored.
Refresh tokens are stored only as hashes on sessions.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from jose import ExpiredSignatureError, JWTError, jwt

from app.core.config import settings
from app.core.security.token_payload import TokenPayload


class JWTManager:
    def __init__(self) -> None:
        self._secret = settings.JWT_SECRET_KEY
        self._algorithm = settings.JWT_ALGORITHM
        self._access_minutes = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        self._refresh_days = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS

    def _encode(self, claims: dict[str, Any], expires_delta: timedelta) -> str:
        now = datetime.now(UTC)
        payload = {
            **claims,
            "iat": now,
            "exp": now + expires_delta,
        }
        return jwt.encode(payload, self._secret, algorithm=self._algorithm)

    def _decode(self, token: str) -> dict[str, Any]:
        return jwt.decode(token, self._secret, algorithms=[self._algorithm])

    def generate_access_token(
        self,
        *,
        login_id: int,
        person_id: int,
        employment_id: int | None = None,
    ) -> str:
        claims = {
            "sub": str(login_id),
            "login_id": login_id,
            "person_id": person_id,
            "employment_id": employment_id,
            "type": "access",
            "jti": str(uuid4()),
        }
        return self._encode(
            claims,
            timedelta(minutes=self._access_minutes),
        )

    def generate_refresh_token(
        self,
        *,
        login_id: int,
        person_id: int,
        session_id: int,
        employment_id: int | None = None,
    ) -> str:
        claims = {
            "sub": str(login_id),
            "login_id": login_id,
            "person_id": person_id,
            "employment_id": employment_id,
            "type": "refresh",
            "jti": str(session_id),  # bind to session row
        }
        return self._encode(
            claims,
            timedelta(days=self._refresh_days),
        )

    def decode_token(self, token: str) -> TokenPayload:
        try:
            raw = self._decode(token)
            return TokenPayload.model_validate(raw)
        except ExpiredSignatureError as exc:
            from app.core.security.exceptions import ExpiredTokenException
            raise ExpiredTokenException() from exc
        except JWTError as exc:
            from app.core.security.exceptions import InvalidTokenException
            raise InvalidTokenException() from exc

    def decode_access_token(self, token: str) -> TokenPayload:
        payload = self.decode_token(token)
        if payload.type != "access":
            from app.core.security.exceptions import InvalidTokenTypeException
            raise InvalidTokenTypeException()
        return payload

    def decode_refresh_token(self, token: str) -> TokenPayload:
        payload = self.decode_token(token)
        if payload.type != "refresh":
            from app.core.security.exceptions import InvalidTokenTypeException
            raise InvalidTokenTypeException()
        return payload

    @property
    def refresh_expires_delta(self) -> timedelta:
        return timedelta(days=self._refresh_days)
