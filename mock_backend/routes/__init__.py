"""Route modules — one file per frontend-aligned domain."""
from . import (
    admin,
    approvals,
    auth,
    dashboard,
    health,
    my_work,
    organization,
    payroll,
    projects,
    sales,
    workforce,
)

__all__ = [
    "admin",
    "approvals",
    "auth",
    "dashboard",
    "health",
    "my_work",
    "organization",
    "payroll",
    "projects",
    "sales",
    "workforce",
]
