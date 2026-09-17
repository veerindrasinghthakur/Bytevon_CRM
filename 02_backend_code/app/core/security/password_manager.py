"""
Password hashing and verification.

Uses the bcrypt library directly. passlib 1.7.4 assumes bcrypt.__about__,
which was removed in bcrypt 4.1+ and can break verify/hash under some installs.
"""

from __future__ import annotations

import bcrypt


class PasswordManager:
    """Stateless password utilities (bcrypt)."""

    @staticmethod
    def hash(password: str) -> str:
        # bcrypt has a 72-byte input limit
        raw = password.encode("utf-8")[:72]
        return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def verify(plain_password: str, hashed_password: str) -> bool:
        if not hashed_password:
            return False
        try:
            raw = plain_password.encode("utf-8")[:72]
            hashed = hashed_password.encode("utf-8")
            return bcrypt.checkpw(raw, hashed)
        except (ValueError, TypeError):
            return False
