/**
 * Central TanStack Query key factory.
 * Prefer these helpers in hooks/mutations so invalidation stays consistent.
 */

export const queryKeys = {
  /** Effective authorization (permissions + scope) — shared RBAC source of truth */
  rbac: {
    all: ['rbac'] as const,
    effective: (employmentId?: number | null) =>
      ['rbac', 'effective', employmentId ?? null] as const,
    /** Seeded backend resource catalog — single source of truth for resource names */
    resources: () => ['rbac', 'resources'] as const,
  },
  admin: {
    users: {
      all: ['admin', 'users'] as const,
      list: (filters?: unknown) => [...queryKeys.admin.users.all, 'list', filters ?? {}] as const,
      detail: (id: number) => [...queryKeys.admin.users.all, 'detail', id] as const,
      withoutLogin: () => [...queryKeys.admin.users.all, 'without-login'] as const,
    },
    roles: {
      all: ['admin', 'roles'] as const,
      list: (filters?: unknown) => [...queryKeys.admin.roles.all, 'list', filters ?? {}] as const,
      detail: (id: string) => [...queryKeys.admin.roles.all, 'detail', id] as const,
      metrics: () => ['admin', 'metrics', 'roles'] as const,
    },
    rbac: {
      all: ['admin', 'rbac'] as const,
      permissionCatalog: () => [...queryKeys.admin.rbac.all, 'permission-catalog'] as const,
    },
    audit: {
      all: ['admin', 'audit'] as const,
      list: (filters?: unknown) => [...queryKeys.admin.audit.all, 'list', filters ?? {}] as const,
    },
    leave: {
      all: ['admin', 'leave'] as const,
      policies: () => [...queryKeys.admin.leave.all, 'policies'] as const,
      ledger: (filters?: unknown) => [...queryKeys.admin.leave.all, 'ledger', filters ?? {}] as const,
    },
    security: {
      all: ['admin', 'security'] as const,
      kpis: () => [...queryKeys.admin.security.all, 'kpis'] as const,
      events: () => [...queryKeys.admin.security.all, 'events'] as const,
    },
    settings: {
      all: ['admin', 'settings'] as const,
      attendance: () => [...queryKeys.admin.settings.all, 'attendance'] as const,
      leaveAccrual: () => [...queryKeys.admin.settings.all, 'leave-accrual'] as const,
    },
    metrics: {
      all: ['admin', 'metrics'] as const,
      attendance: () => [...queryKeys.admin.metrics.all, 'attendance'] as const,
      roles: () => [...queryKeys.admin.metrics.all, 'roles'] as const,
    },
    offices: {
      all: ['admin', 'offices'] as const,
      headOptions: () => [...queryKeys.admin.offices.all, 'head-options'] as const,
    },
  },
  organization: {
    locations: {
      all: ['organization', 'locations'] as const,
      list: (filters?: unknown) =>
        [...queryKeys.organization.locations.all, 'list', filters ?? {}] as const,
      detail: (id: number) => [...queryKeys.organization.locations.all, 'detail', id] as const,
    },
    shifts: {
      all: ['organization', 'shifts'] as const,
      list: (filters?: unknown) =>
        [...queryKeys.organization.shifts.all, 'list', filters ?? {}] as const,
      detail: (id: number) => [...queryKeys.organization.shifts.all, 'detail', id] as const,
      staff: (id: number) => [...queryKeys.organization.shifts.all, 'staff', id] as const,
    },
    holidays: {
      all: () => ['organization', 'holidays'] as const,
      list: () => [...queryKeys.organization.holidays.all(), 'list'] as const,
      detail: (calendarId: number) => [...queryKeys.organization.holidays.all(), 'detail', calendarId] as const,
    },
    settings: () => ['organization', 'settings'] as const,
    workingWeeks: () => ['organization', 'working-weeks'] as const,
    positions: (includeArchived?: boolean) => ['organization', 'positions', { includeArchived }] as const,
  },
  workforce: {
    departments: {
      all: ['workforce', 'departments'] as const,
      list: (filters?: unknown) =>
        [...queryKeys.workforce.departments.all, 'list', filters ?? {}] as const,
      detail: (id: number) => [...queryKeys.workforce.departments.all, 'detail', id] as const,
      staff: (id: number) => [...queryKeys.workforce.departments.all, 'staff', id] as const,
    },
    employees: {
      all: ['workforce', 'employees'] as const,
      list: (filters?: unknown) =>
        [...queryKeys.workforce.employees.all, 'list', filters ?? {}] as const,
      detail: (id: number) => [...queryKeys.workforce.employees.all, 'detail', id] as const,
      bankDetails: (id: number) => [...queryKeys.workforce.employees.all, 'bank-details', id] as const,
    },
    shifts: {
      all: ['workforce', 'shifts'] as const,
      list: (filters?: unknown) => [...queryKeys.workforce.shifts.all, 'list', filters ?? {}] as const,
    },
    attendance: {
      all: ['workforce', 'attendance'] as const,
      dashboard: (params?: unknown) =>
        [...queryKeys.workforce.attendance.all, 'dashboard', params ?? {}] as const,
      today: (filters?: unknown) =>
        [...queryKeys.workforce.attendance.all, 'today', filters ?? {}] as const,
      detail: (id: string) => [...queryKeys.workforce.attendance.all, 'detail', id] as const,
      day: (employmentId: string, date: string) =>
        [...queryKeys.workforce.attendance.all, 'day', employmentId, date] as const,
      corrections: () => [...queryKeys.workforce.attendance.all, 'corrections'] as const,
    },
  },
  teams: {
    all: ['projects', 'teams'] as const,
    list: (filters?: unknown) => [...queryKeys.teams.all, 'list', filters ?? {}] as const,
    detail: (id: number) => [...queryKeys.teams.all, 'detail', id] as const,
    members: (id: number) => [...queryKeys.teams.all, 'members', id] as const,
    projects: (id: number) => [...queryKeys.teams.all, 'projects', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    listPrefix: () => ['projects', 'list'] as const,
    list: (filters?: unknown) => ['projects', 'list', filters ?? {}] as const,
    detail: (id: number) => ['projects', 'detail', id] as const,
  },
  tasks: {
    all: ['projects', 'tasks'] as const,
    list: (filters?: unknown) => [...queryKeys.tasks.all, 'list', filters ?? {}] as const,
    detail: (id: number) => [...queryKeys.tasks.all, 'detail', id] as const,
  },
  documents: {
    all: ['documents'] as const,
    list: (filters?: unknown) => [...queryKeys.documents.all, 'list', filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.documents.all, 'detail', id] as const,
  },
  sales: {
    leads: {
      all: ['sales', 'leads'] as const,
      list: (filters?: unknown) => [...queryKeys.sales.leads.all, 'list', filters ?? {}] as const,
      detail: (id: string) => [...queryKeys.sales.leads.all, 'detail', id] as const,
      filterOptions: () => [...queryKeys.sales.leads.all, 'filter-options'] as const,
    },
    clients: {
      all: ['sales', 'clients'] as const,
      list: (filters?: unknown) => [...queryKeys.sales.clients.all, 'list', filters ?? {}] as const,
      detail: (id: string) => [...queryKeys.sales.clients.all, 'detail', id] as const,
      filterOptions: () => [...queryKeys.sales.clients.all, 'filter-options'] as const,
    },
    caseStudies: {
      all: ['sales', 'case-studies'] as const,
      list: (filters?: unknown) =>
        [...queryKeys.sales.caseStudies.all, 'list', filters ?? {}] as const,
    },
    /** platforms table = lead sources */
    platforms: () => ['sales', 'platforms'] as const,
    salesRepresentatives: () => ['sales', 'sales-representatives'] as const,
    activities: () => ['sales', 'activities'] as const,
    dashboardMetrics: () => ['sales', 'dashboard-metrics'] as const,
  },
  payroll: {
    all: ['payroll'] as const,
    kpis: () => ['payroll', 'kpis'] as const,
    period: () => ['payroll', 'period'] as const,
    activity: () => ['payroll', 'activity'] as const,
    monthlySummary: () => ['payroll', 'monthly-summary'] as const,
    employees: {
      all: ['payroll', 'employees'] as const,
      list: (filters?: unknown) => [...queryKeys.payroll.employees.all, 'list', filters ?? {}] as const,
      detail: (id: string) => [...queryKeys.payroll.employees.all, 'detail', id] as const,
    },
    review: (id: string) => ['payroll', 'review', id] as const,
    payslip: (id: string) => ['payroll', 'payslip', id] as const,
    salary: (id: string) => ['payroll', 'salary', id] as const,
    history: (id: string) => ['payroll', 'history', id] as const,
    runChecks: () => ['payroll', 'run-checks'] as const,
    runPreview: () => ['payroll', 'run-preview'] as const,
    runs: (filters?: unknown) => ['payroll', 'runs', filters ?? {}] as const,
    structure: (employmentId: number | string) => ['payroll', 'structure', employmentId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    inbox: (filters?: unknown) => ['notifications', 'inbox', filters ?? {}] as const,
    inboxAll: () => ['notifications', 'inbox-all'] as const,
    detail: (id: string | number) => ['notifications', 'detail', id] as const,
    sent: (filters?: unknown) => ['notifications', 'sent', filters ?? {}] as const,
    sentAll: () => ['notifications', 'sent-all'] as const,
    triggers: () => ['notifications', 'triggers'] as const,
    channels: () => ['notifications', 'channels'] as const,
  },
  approvals: {
    all: ['approvals'] as const,
    pending: (filters?: unknown) => ['approvals', 'pending', filters ?? {}] as const,
    myRequests: (filters?: unknown) => ['approvals', 'my-requests', filters ?? {}] as const,
    detail: (id: number) => ['approvals', 'detail', id] as const,
  },
  dashboard: {
    executive: () => ['dashboard', 'executive'] as const,
    employee: () => ['dashboard', 'employee'] as const,
    payroll: () => ['dashboard', 'payroll'] as const,
  },
  profile: {
    all: ['profile'] as const,
    me: () => ['profile', 'me'] as const,
    sessions: () => ['profile', 'sessions'] as const,
    activity: () => ['profile', 'activity'] as const,
  },
  myWork: {
    attendance: {
      all: ['my-work', 'attendance'] as const,
      list: (filters?: unknown) => [...queryKeys.myWork.attendance.all, 'list', filters ?? {}] as const,
      todayInfo: () => [...queryKeys.myWork.attendance.all, 'today-info'] as const,
      weekHours: () => [...queryKeys.myWork.attendance.all, 'week-hours'] as const,
    },
    leave: {
      all: ['my-work', 'leave'] as const,
      list: (filters?: unknown) => [...queryKeys.myWork.leave.all, 'list', filters ?? {}] as const,
      balances: () => [...queryKeys.myWork.leave.all, 'balances'] as const,
      applyContext: () => [...queryKeys.myWork.leave.all, 'apply-context'] as const,
      calculate: (params?: unknown) =>
        [...queryKeys.myWork.leave.all, 'calculate', params ?? {}] as const,
    },
    tasks: {
      all: ['my-work', 'tasks'] as const,
      list: (filters?: unknown) => [...queryKeys.myWork.tasks.all, 'list', filters ?? {}] as const,
      detail: (id: string) => [...queryKeys.myWork.tasks.all, 'detail', id] as const,
    },
    corrections: {
      all: ['my-work', 'corrections'] as const,
      list: (filters?: unknown) => [...queryKeys.myWork.corrections.all, 'list', filters ?? {}] as const,
    },
    overview: () => ['my-work', 'overview'] as const,
    bankDetails: () => ['my-work', 'bank-details'] as const,
    approvers: () => ['my-work', 'approvers'] as const,
    holidays: {
      all: ['my-work', 'holidays'] as const,
      list: () => [...queryKeys.myWork.holidays.all, 'list'] as const,
    },
    approvals: {
      all: ['my-work', 'approvals'] as const,
      list: (filters?: unknown) => [...queryKeys.myWork.approvals.all, 'list', filters ?? {}] as const,
    },
    requests: {
      all: ['my-work', 'requests'] as const,
      list: (filters?: unknown) => [...queryKeys.myWork.requests.all, 'list', filters ?? {}] as const,
    },
  },
} as const

type Qc = { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown }

/** Prefix invalidation helpers for common mutation settle handlers */
export const invalidate = {
  rbac: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.rbac.all }),
  teams: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.teams.all }),
  projects: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  tasks: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  documents: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.documents.all }),
  employees: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.workforce.employees.all }),
  workforceAttendance: (qc: Qc) =>
    void qc.invalidateQueries({ queryKey: queryKeys.workforce.attendance.all }),
  users: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.admin.users.all }),
  roles: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.admin.roles.all }),
  audit: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.admin.audit.all }),
  salesLeads: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.sales.leads.all }),
  salesClients: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.sales.clients.all }),
  salesCaseStudies: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.sales.caseStudies.all }),
  caseStudies: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.sales.caseStudies.all }),
  notifications: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  approvals: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.approvals.all }),
  organizationLocations: (qc: Qc) =>
    void qc.invalidateQueries({ queryKey: queryKeys.organization.locations.all }),
  organizationShifts: (qc: Qc) =>
    void qc.invalidateQueries({ queryKey: queryKeys.organization.shifts.all }),
  locations: (qc: Qc) =>
    void qc.invalidateQueries({ queryKey: queryKeys.organization.locations.all }),
  orgShifts: (qc: Qc) =>
    void qc.invalidateQueries({ queryKey: queryKeys.organization.shifts.all }),
  myWorkTasks: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.myWork.tasks.all }),
  myWorkLeave: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.myWork.leave.all }),
  myWorkAttendance: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.myWork.attendance.all }),
  myWorkCorrections: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.myWork.corrections.all }),
  myWorkBank: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.myWork.bankDetails() }),
  myWorkApprovals: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.myWork.approvals.all }),
  workforceEmployeeBank: (qc: Qc, employeeId: number) =>
    void qc.invalidateQueries({ queryKey: queryKeys.workforce.employees.bankDetails(employeeId) }),
  payroll: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.payroll.all }),
  payrollEmployees: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.payroll.employees.all }),
  adminRbac: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.admin.rbac.all }),
  adminSecurity: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.admin.security.all }),
  adminLeave: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.admin.leave.all }),
  dashboard: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.dashboard.executive() }),
  profile: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.profile.all }),
}
