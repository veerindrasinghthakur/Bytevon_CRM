"""Import all ORM models so Base.metadata is fully populated for Alembic."""
from __future__ import annotations

from app.core.base import Base  # noqa: F401
from app.modules.admin.models import (  # noqa: F401
    Holiday,
    HolidayCalendar,
    Location,
    OrganizationSettings,
    Shift,
    WorkingWeek,
)
from app.modules.approvals.models import (  # noqa: F401
    ApprovalAction,
    ApprovalRequest,
)
from app.modules.audit.models import AuditLog  # noqa: F401
from app.modules.auth.models import (  # noqa: F401
    Login,
    PasswordResetToken,
    Person,
    Session,
)
from app.modules.leave.models import (  # noqa: F401
    LeaveLedger,
    LeavePolicy,
    LeaveRequest,
    LeaveType,
)
from app.modules.notifications.models import (  # noqa: F401
    Notification,
    NotificationPreference,
    NotificationTemplate,
)
from app.modules.payroll.models import (  # noqa: F401
    EmployeeBankAccount,
    EmployeeSalary,
    EmployeeSalaryItem,
    MonthlyPayroll,
    MonthlyPayrollItem,
)
from app.modules.project.document.models import (  # noqa: F401
    Document,
    DocumentLink,
    DocumentType,
    DocumentVersion,
)
from app.modules.project.note.models import Note  # noqa: F401
from app.modules.project.project.models import Project  # noqa: F401
from app.modules.project.task.models import Task, TaskTimeEntry  # noqa: F401
from app.modules.project.team.models import Team, TeamMember  # noqa: F401
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
from app.modules.sales.models import (  # noqa: F401
    Client,
    ClientContact,
    Lead,
    Platform,
)

# Attendance models live under workforce
from app.modules.workforce.attendance.models import (  # noqa: F401
    AttendanceBreak,
    AttendanceCorrection,
    AttendanceDay,
    AttendancePolicy,
    AttendancePunch,
    MonthlyAttendanceSummary,
)
from app.modules.workforce.department.models import Department  # noqa: F401
from app.modules.workforce.models import (  # noqa: F401
    Employment,
    EmploymentAssignment,
    EmploymentStateHistory,
    Position,
)

__all__ = ["Base"]
