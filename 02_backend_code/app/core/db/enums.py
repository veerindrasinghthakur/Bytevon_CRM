"""
Centralized application enums (StrEnum).

Values use UPPER_SNAKE to match schema documentation style.
SQLAlchemy models reference these enums.
"""

from __future__ import annotations

from enum import Enum


class StrEnum(str, Enum):  # noqa: UP042 -- intentional backport: adds values() helper used by sales routes; stdlib StrEnum lacks it
    def __str__(self) -> str:
        return self.value

    @classmethod
    def values(cls) -> list[str]:
        return [m.value for m in cls]


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

class SessionStatus(StrEnum):
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"


class SessionRevokeReason(StrEnum):
    USER_LOGOUT = "USER_LOGOUT"
    ADMIN_REVOKED = "ADMIN_REVOKED"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED"
    ACCOUNT_DISABLED = "ACCOUNT_DISABLED"
    SESSION_EXPIRED = "SESSION_EXPIRED"


class DeviceType(StrEnum):
    DESKTOP = "DESKTOP"
    MOBILE = "MOBILE"
    TABLET = "TABLET"
    OTHER = "OTHER"


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------

class HolidayType(StrEnum):
    NATIONAL = "NATIONAL"
    REGIONAL = "REGIONAL"
    OPTIONAL = "OPTIONAL"
    COMPANY = "COMPANY"


# ---------------------------------------------------------------------------
# Employment
# ---------------------------------------------------------------------------

class EmploymentType(StrEnum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    INTERN = "INTERN"
    CONTRACTOR = "CONTRACTOR"
    CONSULTANT = "CONSULTANT"


class EmploymentState(StrEnum):
    ONBOARDING = "ONBOARDING"
    PROBATION = "PROBATION"
    CONFIRMED = "CONFIRMED"
    SERVING_NOTICE = "SERVING_NOTICE"
    RESIGNED = "RESIGNED"
    TERMINATED = "TERMINATED"
    ALUMNI = "ALUMNI"


class WorkMode(StrEnum):
    OFFICE = "OFFICE"
    WFH = "WFH"


# ---------------------------------------------------------------------------
# RBAC
# ---------------------------------------------------------------------------

class Action(StrEnum):
    VIEW = "VIEW"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    APPROVE = "APPROVE"
    EXPORT = "EXPORT"
    UNLOCK = "UNLOCK"


class ScopeName(StrEnum):
    SELF = "SELF"
    TEAM = "TEAM"
    DEPARTMENT = "DEPARTMENT"
    LOCATION = "LOCATION"
    ORGANIZATION = "ORGANIZATION"
    CUSTOM = "CUSTOM"


# ---------------------------------------------------------------------------
# Approvals
# ---------------------------------------------------------------------------

class ApprovalTarget(StrEnum):
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD"
    DEPARTMENT = "DEPARTMENT"


class ApprovalStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class ApprovalActionType(StrEnum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMMENTED = "COMMENTED"
    FORWARDED = "FORWARDED"


# ---------------------------------------------------------------------------
# Leave
# ---------------------------------------------------------------------------

class LeaveType(StrEnum):
    CASUAL = "CASUAL"
    SICK = "SICK"
    EARNED = "EARNED"
    MATERNITY = "MATERNITY"
    PATERNITY = "PATERNITY"
    LOSS_OF_PAY = "LOSS_OF_PAY"
    COMP_OFF = "COMP_OFF"


class LeaveRequestStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class LeaveLedgerTransactionType(StrEnum):
    ENTITLEMENT = "ENTITLEMENT"
    ACCRUAL = "ACCRUAL"
    CONSUMPTION = "CONSUMPTION"
    CARRY_FORWARD = "CARRY_FORWARD"
    ADJUSTMENT = "ADJUSTMENT"
    REVERSAL = "REVERSAL"


# ---------------------------------------------------------------------------
# Attendance
# ---------------------------------------------------------------------------

class AttendanceStatus(StrEnum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    HOLIDAY = "HOLIDAY"
    WEEK_OFF = "WEEK_OFF"
    ON_LEAVE = "ON_LEAVE"


class PunchType(StrEnum):
    CHECK_IN = "CHECK_IN"
    CHECK_OUT = "CHECK_OUT"


class AttendanceCorrectionStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class NotificationChannel(StrEnum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    # SMS / PUSH deferred past V1


class NotificationRecipientType(StrEnum):
    EMPLOYMENT = "EMPLOYMENT"
    DEPARTMENT = "DEPARTMENT"
    TEAM = "TEAM"


class NotificationStatus(StrEnum):
    UNREAD = "UNREAD"
    READ = "READ"
    ARCHIVED = "ARCHIVED"


class NotificationAction(StrEnum):
    OPEN = "OPEN"
    MARK_READ = "MARK_READ"
    ARCHIVE = "ARCHIVE"
    DISMISS = "DISMISS"


class NotificationPriority(StrEnum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# Sales / Developer
# ---------------------------------------------------------------------------

class ClientType(StrEnum):
    INDIVIDUAL = "INDIVIDUAL"
    COMPANY = "COMPANY"


class LeadStatus(StrEnum):
    """Normalized lead lifecycle (messy schema draft values cleaned)."""

    NEW = "NEW"
    PROPOSAL_SENT = "PROPOSAL_SENT"
    CHAT_OPEN = "CHAT_OPEN"
    MEETING = "MEETING"
    EXECUTION_PLAN_SENT = "EXECUTION_PLAN_SENT"
    PAYMENT_DISCUSSION = "PAYMENT_DISCUSSION"
    WON = "WON"
    LOST = "LOST"
    FOLLOW_UP = "FOLLOW_UP"
    CLOSED = "CLOSED"


class ProjectSource(StrEnum):
    LEAD = "LEAD"
    MANUAL = "MANUAL"


class ProjectAssignmentType(StrEnum):
    INDIVIDUAL = "INDIVIDUAL"
    TEAM = "TEAM"


class ProjectStatus(StrEnum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    ARCHIVED = "ARCHIVED"


class ProjectPhase(StrEnum):
    INITIAL = "INITIAL"
    DISCOVERY = "DISCOVERY"
    ANALYSIS = "ANALYSIS"
    DESIGN = "DESIGN"
    DEVELOPMENT = "DEVELOPMENT"
    TESTING = "TESTING"
    UAT = "UAT"
    DEPLOYMENT = "DEPLOYMENT"
    MAINTENANCE = "MAINTENANCE"
    CLOSED = "CLOSED"


class TaskPriority(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TaskStatus(StrEnum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    IN_REVIEW = "IN_REVIEW"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"
    CANCELLED = "CANCELLED"


# ---------------------------------------------------------------------------
# Notes / Documents
# ---------------------------------------------------------------------------

class NoteReferenceType(StrEnum):
    LEAD = "LEAD"
    TASK = "TASK"
    CLIENT = "CLIENT"
    # PROJECT intentionally excluded per locked decision


class DocumentStatus(StrEnum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class DocumentLinkType(StrEnum):
    EMPLOYMENT = "EMPLOYMENT"
    LEAVE_REQUEST = "LEAVE_REQUEST"
    ATTENDANCE_CORRECTION = "ATTENDANCE_CORRECTION"
    APPROVAL_REQUEST = "APPROVAL_REQUEST"
    NOTE = "NOTE"
    OTHER = "OTHER"
    # Practical extensions for entity docs
    LEAD = "LEAD"
    PROJECT = "PROJECT"
    TASK = "TASK"
    CLIENT = "CLIENT"


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------

class AuditAction(StrEnum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    ARCHIVE = "ARCHIVE"
    RESTORE = "RESTORE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    ASSIGN = "ASSIGN"
    UNASSIGN = "UNASSIGN"
    STATUS_CHANGE = "STATUS_CHANGE"
    EXPORT = "EXPORT"


class AuditReferenceType(StrEnum):
    EMPLOYMENT = "EMPLOYMENT"
    LOGIN = "LOGIN"
    ROLE = "ROLE"
    PERMISSION = "PERMISSION"
    DEPARTMENT = "DEPARTMENT"
    LOCATION = "LOCATION"
    LEAVE_REQUEST = "LEAVE_REQUEST"
    ATTENDANCE = "ATTENDANCE"
    ATTENDANCE_CORRECTION = "ATTENDANCE_CORRECTION"
    APPROVAL_REQUEST = "APPROVAL_REQUEST"
    CLIENT = "CLIENT"
    LEAD = "LEAD"
    PROJECT = "PROJECT"
    TASK = "TASK"
    TEAM = "TEAM"
    NOTE = "NOTE"
    DOCUMENT = "DOCUMENT"
    NOTIFICATION = "NOTIFICATION"
    ORGANIZATION = "ORGANIZATION"
    SYSTEM = "SYSTEM"
    SESSION = "SESSION"
    PLATFORM = "PLATFORM"
    PAYROLL = "PAYROLL"


# ---------------------------------------------------------------------------
# Payroll
# ---------------------------------------------------------------------------

class PayrollStatus(StrEnum):
    CALCULATED = "CALCULATED"
    APPROVED = "APPROVED"
    PAID = "PAID"


class SalaryItemType(StrEnum):
    EARNING = "EARNING"
    DEDUCTION = "DEDUCTION"


class PayrollItemType(StrEnum):
    EARNING = "EARNING"
    DEDUCTION = "DEDUCTION"
    ADJUSTMENT = "ADJUSTMENT"
