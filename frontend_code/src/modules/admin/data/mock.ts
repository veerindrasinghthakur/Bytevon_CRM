import { LeaveType } from '@/shared/schema'
import type {
  AdminUser,
  AdminRole,
  AuditLog,
  SecurityEvent,
  AdminKpis,
  LeaveTypeSettingRow,
  LeavePolicyRow,
  LeaveLedgerRow,
  OfficeLocation,
  OrganizationProfile,
  AttendanceSettings,
  LeaveAccrualPolicy,
} from '../types'

export type { AdminUser, AdminRole, AuditLog, SecurityEvent } from '../types'

export const adminUsers: AdminUser[] = [
  {
    id: 'U-1001',
    name: 'Sarah Chen',
    email: 'sarah.chen@bytevon.com',
    role: 'Super Admin',
    department: 'Engineering',
    status: 'Active',
    lastLogin: 'Aug 14, 2026 09:12',
    initials: 'SC',
  },
  {
    id: 'U-1002',
    name: 'Marcus Chen',
    email: 'marcus.chen@bytevon.com',
    role: 'HR Manager',
    department: 'People',
    status: 'Active',
    lastLogin: 'Aug 14, 2026 08:40',
    initials: 'MC',
  },
  {
    id: 'U-1003',
    name: 'Elena Rodriguez',
    email: 'elena.r@bytevon.com',
    role: 'Finance Lead',
    department: 'Finance',
    status: 'Active',
    lastLogin: 'Aug 13, 2026 17:22',
    initials: 'ER',
  },
  {
    id: 'U-1004',
    name: 'David Wilson',
    email: 'david.w@bytevon.com',
    role: 'Employee',
    department: 'Sales',
    status: 'Locked',
    lastLogin: 'Aug 10, 2026 11:05',
    initials: 'DW',
  },
  {
    id: 'U-1005',
    name: 'Priya Sharma',
    email: 'priya.s@bytevon.com',
    role: 'Project Manager',
    department: 'Delivery',
    status: 'Inactive',
    lastLogin: 'Jul 28, 2026 14:18',
    initials: 'PS',
  },
]

export const adminRoles: AdminRole[] = [
  {
    id: 'R-01',
    name: 'Senior Administrator',
    description:
      'Complete access to all system modules, financial reporting, and high-level user governance settings.',
    usersCount: 4,
    permissions: ['users.manage', 'roles.manage', 'settings.write', 'audit.read', 'security.manage'],
    status: 'Active',
    category: 'Core Role',
    coveragePct: 100,
    coverageLabel: 'Full Access',
    created: 'Jan 12, 2024',
    updated: '2h ago',
  },
  {
    id: 'R-02',
    name: 'Sales Manager',
    description:
      'Management of sales pipelines, CRM data entry, lead assignment, and regional sales reporting.',
    usersCount: 12,
    permissions: ['leads.manage', 'clients.read', 'pipeline.write', 'reports.read'],
    status: 'Active',
    category: 'Operational',
    coveragePct: 66,
    coverageLabel: '12/18 Modules',
    created: 'Feb 05, 2024',
    updated: 'Mar 01, 2024',
  },
  {
    id: 'R-03',
    name: 'Junior Accountant',
    description: 'Expense submission, invoice tracking, and read-only access to departmental budgets.',
    usersCount: 8,
    permissions: ['expenses.submit', 'invoices.read', 'budget.read'],
    status: 'Active',
    category: 'Financial',
    coveragePct: 28,
    coverageLabel: '5/18 Modules',
    created: 'Mar 18, 2024',
    updated: 'Apr 02, 2024',
  },
  {
    id: 'R-04',
    name: 'HR Manager',
    description: 'Workforce, leave, and attendance administration across departments.',
    usersCount: 5,
    permissions: ['employees.read', 'leave.manage', 'attendance.manage', 'departments.read'],
    status: 'Active',
    category: 'Operational',
    coveragePct: 55,
    coverageLabel: '10/18 Modules',
    created: 'Jan 20, 2024',
    updated: '1d ago',
  },
  {
    id: 'R-05',
    name: 'Finance Lead',
    description: 'Expense and budget approval scopes with reporting access.',
    usersCount: 3,
    permissions: ['expenses.approve', 'budget.read', 'reports.finance'],
    status: 'Active',
    category: 'Financial',
    coveragePct: 40,
    coverageLabel: '7/18 Modules',
    created: 'Feb 12, 2024',
    updated: 'Jul 15, 2024',
  },
  {
    id: 'R-06',
    name: 'Employee',
    description: 'Standard self-service access for attendance, leave, and personal tasks.',
    usersCount: 1200,
    permissions: ['my-work.read', 'requests.submit'],
    status: 'Active',
    category: 'Standard',
    coveragePct: 15,
    coverageLabel: '3/18 Modules',
    created: 'Jan 01, 2024',
    updated: 'Aug 01, 2024',
  },
]

export const auditLogs: AuditLog[] = [
  {
    id: 'AUD-9001',
    action: 'Role updated',
    actor: 'Sarah Chen',
    actorInitials: 'SC',
    target: 'HR Manager',
    module: 'Roles',
    timestamp: 'Aug 14, 2026 10:22',
    ip: '10.0.12.4',
  },
  {
    id: 'AUD-9000',
    action: 'User locked',
    actor: 'System',
    actorInitials: 'SY',
    target: 'David Wilson',
    module: 'Auth',
    timestamp: 'Aug 14, 2026 09:01',
    ip: '—',
  },
  {
    id: 'AUD-8998',
    action: 'Settings saved',
    actor: 'Sarah Chen',
    actorInitials: 'SC',
    target: 'Attendance policy',
    module: 'Settings',
    timestamp: 'Aug 13, 2026 16:44',
    ip: '10.0.12.4',
  },
  {
    id: 'AUD-8995',
    action: 'Permission granted',
    actor: 'Marcus Chen',
    actorInitials: 'MC',
    target: 'leave.manage → Priya Sharma',
    module: 'Roles',
    timestamp: 'Aug 12, 2026 11:30',
    ip: '10.0.8.22',
  },
]

export const securityEvents: SecurityEvent[] = [
  {
    id: 'SEC-1001',
    eventType: 'Successful Login',
    identity: 'sarah.chen@bytevon.com',
    source: '10.0.12.4 · Chrome',
    timestamp: 'Aug 14, 2026 09:12',
    status: 'Success',
  },
  {
    id: 'SEC-1000',
    eventType: 'Account Lockout',
    identity: 'david.w@bytevon.com',
    source: '203.0.113.42 · Unknown',
    timestamp: 'Aug 14, 2026 09:01',
    status: 'Blocked',
  },
  {
    id: 'SEC-999',
    eventType: 'Password Changed',
    identity: 'marcus.chen@bytevon.com',
    source: '10.0.8.22 · Safari',
    timestamp: 'Aug 13, 2026 18:44',
    status: 'Success',
  },
  {
    id: 'SEC-998',
    eventType: 'Geo-fence Block',
    identity: 'unknown@external.io',
    source: '185.220.101.1 · Tor',
    timestamp: 'Aug 13, 2026 14:22',
    status: 'Blocked',
  },
  {
    id: 'SEC-997',
    eventType: 'Session Revoked',
    identity: 'elena.r@bytevon.com',
    source: 'Admin action',
    timestamp: 'Aug 12, 2026 11:05',
    status: 'Warning',
  },
]

export const adminKpis: AdminKpis = {
  users: 1284,
  roles: 12,
  activeSessions: 86,
  auditEventsToday: 142,
  configHealth: 'Good',
  securityScore: 94,
  mfaAdoption: 88,
  openAlerts: 0,
}

/** Leave settings page — type cards */
export const leaveTypeSettings: LeaveTypeSettingRow[] = [
  {
    name: 'Annual Leave',
    desc: 'Standard paid vacation',
    days: '21 Days',
    eligibility: 'All Employees',
    eligibilityStyle: 'bg-secondary/10 text-secondary',
  },
  {
    name: 'Sick Leave',
    desc: 'Medical and health related',
    days: '10 Days',
    eligibility: 'All Employees',
    eligibilityStyle: 'bg-secondary/10 text-secondary',
  },
  {
    name: 'Maternity Leave',
    desc: 'Parental support leave',
    days: '90 Days',
    eligibility: 'Female only',
    eligibilityStyle: 'bg-surface-container text-on-surface-variant',
  },
  {
    name: 'Casual Leave',
    desc: 'Unplanned personal matters',
    days: '5 Days',
    eligibility: 'Full-time',
    eligibilityStyle: 'bg-secondary/10 text-secondary',
  },
]

export const leavePolicies: LeavePolicyRow[] = [
  {
    id: 1,
    name: 'Casual 2026',
    leave_type: LeaveType.CASUAL,
    annual_entitlement: 12,
    carry_forward_limit: 3,
    effective_from: '2026-01-01',
    effective_to: null,
  },
  {
    id: 2,
    name: 'Sick 2026',
    leave_type: LeaveType.SICK,
    annual_entitlement: 10,
    carry_forward_limit: 0,
    effective_from: '2026-01-01',
    effective_to: null,
  },
  {
    id: 3,
    name: 'Earned 2025',
    leave_type: LeaveType.EARNED,
    annual_entitlement: 15,
    carry_forward_limit: 5,
    effective_from: '2025-01-01',
    effective_to: '2025-12-31',
  },
]

export const leaveLedger: LeaveLedgerRow[] = [
  {
    id: 1,
    leave_type: LeaveType.CASUAL,
    transaction_type: 'CREDIT',
    days: 12,
    reference_type: 'POLICY',
    created_at: '2026-01-01',
  },
  {
    id: 2,
    leave_type: LeaveType.CASUAL,
    transaction_type: 'DEBIT',
    days: -2,
    reference_type: 'LEAVE_REQUEST',
    created_at: '2026-03-12',
  },
  {
    id: 3,
    leave_type: LeaveType.SICK,
    transaction_type: 'CREDIT',
    days: 10,
    reference_type: 'POLICY',
    created_at: '2026-01-01',
  },
]

/** Offices used by Head Office settings + Office form */
export const offices: OfficeLocation[] = [
  {
    id: 'ny',
    name: 'New York HQ',
    country: 'United States',
    city: 'New York',
    timezone: 'UTC-05:00 Eastern Time',
    currency: 'USD ($)',
    fiscal: 'Jan - Dec',
    address: '123 Enterprise Way, Suite 500',
    postal: '10001',
  },
  {
    id: 'ldn',
    name: 'London Office',
    country: 'United Kingdom',
    city: 'London',
    timezone: 'UTC+00:00 GMT',
    currency: 'GBP (£)',
    fiscal: 'Apr - Mar',
    address: '10 Canary Wharf',
    postal: 'E14 5AB',
  },
  {
    id: 'blr',
    name: 'Bangalore Hub',
    country: 'India',
    city: 'Bengaluru',
    timezone: 'UTC+05:30 IST',
    currency: 'INR (₹)',
    fiscal: 'Apr - Mar',
    address: 'Manyata Tech Park',
    postal: '560045',
  },
]

/** Compact labels for Head Office section (same data, shorter display fields) */
export const headOfficeList = offices.map((o) => ({
  id: o.id,
  name: o.name,
  country: o.id === 'ny' ? 'USA' : o.id === 'ldn' ? 'UK' : 'India',
  city: o.city,
  timezone: o.id === 'ny' ? 'EST' : o.id === 'ldn' ? 'GMT' : 'IST',
  currency: o.id === 'ny' ? 'USD' : o.id === 'ldn' ? 'GBP' : 'INR',
  fiscal: o.id === 'ny' ? 'Jan-Dec' : 'Apr-Mar',
  address: o.address,
  postal: o.postal,
}))

/** Mutable mock — organisation profile (settings server state) */
export const organizationProfileMock: OrganizationProfile = {
  name: 'Bytevon Global Holdings',
  legal: 'Bytevon Global Holdings Inc.',
  email: 'admin@bytevon.com',
  phone: '+1 (555) 012-3456',
  website: 'https://bytevon.com',
  tax: 'TX-9928341',
  reg: 'BRN-001293',
  description: 'Leading enterprise solutions provider for global workforce management.',
}

/** Mutable mock — attendance company policy */
export const attendanceSettingsMock: AttendanceSettings = {
  shiftStart: '09:00',
  shiftEnd: '18:00',
  graceMinutes: 15,
  earlyOutMinutes: 30,
  otMinMinutes: 60,
  allowRemoteCheckIn: true,
}

/** Mutable mock — leave accrual company policy */
export const leaveAccrualPolicyMock: LeaveAccrualPolicy = {
  maxCarryOverDays: 10,
  minimumNoticeDays: 7,
}
