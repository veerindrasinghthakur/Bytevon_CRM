/**
 * Central TanStack Query key factory.
 * Prefer these helpers in hooks/mutations so invalidation stays consistent.
 */

export const queryKeys = {
  admin: {
    users: {
      all: ['admin', 'users'] as const,
      list: (filters?: unknown) => [...queryKeys.admin.users.all, 'list', filters ?? {}] as const,
    },
    roles: {
      all: ['admin', 'roles'] as const,
      list: () => [...queryKeys.admin.roles.all, 'list'] as const,
      metrics: () => ['admin', 'metrics', 'roles'] as const,
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
    },
    shifts: {
      all: ['workforce', 'shifts'] as const,
      list: (filters?: unknown) => [...queryKeys.workforce.shifts.all, 'list', filters ?? {}] as const,
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
    salesRepresentatives: () => ['sales', 'sales-representatives'] as const,
    activities: () => ['sales', 'activities'] as const,
    dashboardMetrics: () => ['sales', 'dashboard-metrics'] as const,
  },
  payroll: {
    all: ['payroll'] as const,
    runs: (filters?: unknown) => ['payroll', 'runs', filters ?? {}] as const,
    structure: (employmentId: number) => ['payroll', 'structure', employmentId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    inbox: (filters?: unknown) => ['notifications', 'inbox', filters ?? {}] as const,
    detail: (id: number) => ['notifications', 'detail', id] as const,
    sent: (filters?: unknown) => ['notifications', 'sent', filters ?? {}] as const,
  },
  approvals: {
    all: ['approvals'] as const,
    pending: (filters?: unknown) => ['approvals', 'pending', filters ?? {}] as const,
    myRequests: (filters?: unknown) => ['approvals', 'my-requests', filters ?? {}] as const,
    detail: (id: number) => ['approvals', 'detail', id] as const,
  },
  myWork: {
    attendance: ['my-work', 'attendance'] as const,
    leave: ['my-work', 'leave'] as const,
    tasks: {
      all: ['my-work', 'tasks'] as const,
      list: (filters?: unknown) => [...queryKeys.myWork.tasks.all, 'list', filters ?? {}] as const,
    },
    overview: ['my-work', 'overview'] as const,
  },
} as const

type Qc = { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown }

/** Prefix invalidation helpers for common mutation settle handlers */
export const invalidate = {
  teams: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.teams.all }),
  projects: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  tasks: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  documents: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.documents.all }),
  employees: (qc: Qc) => void qc.invalidateQueries({ queryKey: queryKeys.workforce.employees.all }),
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
}
