"""Route modules — one file per frontend-aligned domain."""
from . import admin, auth, dashboard, health, my_work, organization, extras

__all__ = ["admin", "auth", "dashboard", "health", "my_work", "organization", "extras"]
