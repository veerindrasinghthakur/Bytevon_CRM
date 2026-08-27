"""Route modules — one file per frontend-aligned domain."""
from . import admin, auth, dashboard, health, my_work, organization, projects, sales

__all__ = [
    "admin",
    "auth",
    "dashboard",
    "health",
    "my_work",
    "organization",
    "projects",
    "sales",
]
