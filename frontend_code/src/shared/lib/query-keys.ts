/**
 * Central TanStack Query key factory.
 * Prefer these helpers in hooks/mutations so invalidation stays consistent.
 */

export const queryKeys = {
  admin: {
    users: {
      all: ['admin', 'users'] as const,
      list: () => [...queryKeys.admin.users.all, 'list'] as const,
    },
    roles: {
      all: ['admin', 'roles'] as const,
      list: () => [...queryKeys.admin.roles.all, 'list'] as const,
      metrics: () => ['admin', 'metrics', 'roles'] as const,
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
    list: (filters?: unknown) => ['projects', 'list', filters ?? {}] as const,
    detail: (id: number) => ['projects', 'detail', id] as const,
  },
  tasks: {
    all: ['projects', 'tasks'] as const,
    list: (filters?: unknown) => [...queryKeys.tasks.all, 'list', filters ?? {}] as const,
    detail: (id: number) => [...queryKeys.tasks.all, 'detail', id] as const,
  },
  sales: {
    leads: {
      all: ['sales', 'leads'] as const,
      list: (filters?: unknown) => [...queryKeys.sales.leads.all, 'list', filters ?? {}] as const,
    },
    clients: {
      all: ['sales', 'clients'] as const,
      list: (filters?: unknown) => [...queryKeys.sales.clients.all, 'list', filters ?? {}] as const,
    },
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
    pending: () => ['approvals', 'pending'] as const,
    detail: (id: number) => ['approvals', 'detail', id] as const,
  },
  myWork: {
    attendance: ['my-work', 'attendance'] as const,
    leave: ['my-work', 'leave'] as const,
  },
} as const

/** Prefix invalidation helpers for common mutation settle handlers */
export const invalidate = {
  teams: (qc: { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown }) =>
    void qc.invalidateQueries({ queryKey: queryKeys.teams.all }),
  projects: (qc: { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown }) =>
    void qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  departments: (qc: { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown }) =>
    void qc.invalidateQueries({ queryKey: queryKeys.workforce.departments.all }),
  employees: (qc: { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown }) =>
    void qc.invalidateQueries({ queryKey: queryKeys.workforce.employees.all }),
}
