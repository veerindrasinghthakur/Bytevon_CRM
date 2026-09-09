"""
Import all ORM models so Base.metadata is fully populated for Alembic.

Alembic env.py and any metadata reflection must import this module.
"""

from __future__ import annotations

# Core base
from app.core.base import Base  # noqa: F401

# Authentication
from app.modules.auth.models import (  # noqa: F401
    Login,
    PasswordResetToken,
    Person,
    Session,
)

# Organization
from app.modules.organization.models import (  # noqa: F401
    Department,
    Holiday,
    HolidayCalendar,
    Location,
    OrganizationSettings,
    Shift,
    WorkingWeek,
)

# Employment
from app.modules.workforce.models import (  # noqa: F401
    Employment,
    EmploymentAssignment,
    EmploymentStateHistory,
    Position,
)

# RBAC
from app.modules.rbac.models import (  # noqa: F401
    EmployeeRole,
    Permission,
    Resource,
    Role,
    RolePermission,
    RoleSensitiveFieldPermission,
    Scope,
    SensitiveField,
)

# Approvals
from app.modules.approvals.models import (  # noqa: F401
    ApprovalAction,
    ApprovalRequest,
)

# Leave
from app.modules.leave.models import (  # noqa: F401
    LeaveLedger,
    LeavePolicy,
    LeaveRequest,
)

# Attendance
from app.modules.attendance.models import (  # noqa: F401
    AttendanceBreak,
    AttendanceCorrection,
    AttendanceDay,
    AttendancePolicy,
    AttendancePunch,
    MonthlyAttendanceSummary,
)

# Notifications
from app.modules.notifications.models import (  # noqa: F401
    Notification,
    NotificationPreference,
    NotificationTemplate,
)

# Sales
from app.modules.sales.models import (  # noqa: F401
    Client,
    ClientContact,
    Lead,
    Platform,
)

# Developer
from app.modules.project.models import (  # noqa: F401
    Project,
    Task,
    TaskTimeEntry,
    Team,
    TeamMember,
)

# Notes & Documents
from app.modules.notes_documents.models import (  # noqa: F401
    Document,
    DocumentLink,
    DocumentType,
    DocumentVersion,
    Note,
)

# Audit
from app.modules.audit.models import AuditLog  # noqa: F401

# Payroll
from app.modules.payroll.models import (  # noqa: F401
    EmployeeBankAccount,
    EmployeeSalary,
    EmployeeSalaryItem,
    MonthlyPayroll,
    MonthlyPayrollItem,
)

__all__ = ["Base"]
