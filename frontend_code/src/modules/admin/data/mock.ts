export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'Active' | 'Inactive' | 'Locked'
  lastLogin: string
  initials: string
}

export interface AdminRole {
  id: string
  name: string
  description: string
  usersCount: number
  permissions: string[]
  status: 'Active' | 'Archived'
}

export interface AuditLog {
  id: string
  action: string
  actor: string
  actorInitials: string
  target: string
  module: string
  timestamp: string
  ip: string
}

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
    name: 'Super Admin',
    description: 'Full system access including security and audit.',
    usersCount: 2,
    permissions: ['users.manage', 'roles.manage', 'settings.write', 'audit.read', 'security.manage'],
    status: 'Active',
  },
  {
    id: 'R-02',
    name: 'HR Manager',
    description: 'Workforce, leave, and attendance administration.',
    usersCount: 5,
    permissions: ['employees.read', 'leave.manage', 'attendance.manage'],
    status: 'Active',
  },
  {
    id: 'R-03',
    name: 'Finance Lead',
    description: 'Expense and budget approval scopes.',
    usersCount: 3,
    permissions: ['expenses.approve', 'budget.read'],
    status: 'Active',
  },
  {
    id: 'R-04',
    name: 'Employee',
    description: 'Standard self-service access.',
    usersCount: 1200,
    permissions: ['my-work.read', 'requests.submit'],
    status: 'Active',
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

export const adminKpis = {
  users: 1284,
  roles: 12,
  activeSessions: 86,
  auditEventsToday: 142,
  configHealth: 'Good' as const,
}
