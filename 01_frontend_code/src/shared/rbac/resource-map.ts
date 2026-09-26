/**
 * Navigation → backend resource map (single place).
 *
 * Values are lowercase resource names from the backend `resources` table —
 * NOT a frontend enum. Backend is the single source of truth; this map only
 * says which resource gates which nav entry.
 *
 * null = always visible when authenticated (self-service / shell).
 */

/** Primary rail module id → backend resource used for the VIEW gate. */
export const RAIL_RESOURCE_BY_ID: Record<string, string | null> = {
  dashboard: null, // scope-filtered data, visible to all authenticated users
  'my-work': null, // self-service always visible
  sales: 'lead',
  projects: 'project',
  workforce: 'employment',
  payroll: 'payroll',
  approvals: 'approval',
  admin: 'role',
  notifications: 'notification',
  profile: null,
}

/**
 * Secondary sidebar item id → action used for the gate.
 * Defaults to VIEW; entries below mirror routes whose beforeLoad requires
 * a stronger action (e.g. /payroll/run and /notifications/compose require CREATE).
 */
export const SECONDARY_ACTION_BY_ID: Record<string, string> = {
  run: 'CREATE',
  compose: 'CREATE',
}

/**
 * Secondary sidebar item id → minimum scope floor.
 * Empty by default (no floor — mirrors action-only route guards).
 * Floors are added only where the matching route also enforces minScope
 * (sensitive finance/notification creates); never ahead of the route.
 */
export const SECONDARY_MIN_SCOPE_BY_ID: Record<string, string> = {}

/** Secondary sidebar item id → backend resource used for the gate. */
export const SECONDARY_RESOURCE_BY_ID: Record<string, string | null> = {
  // sales
  dashboard: 'lead',
  leads: 'lead',
  clients: 'client',
  sources: 'lead',
  'case-studies': 'lead',
  // projects
  'all-projects': 'project',
  teams: 'project',
  tasks: 'task',
  documents: 'document',
  // workforce
  employees: 'employment',
  departments: 'department',
  shifts: 'shift',
  attendance: 'attendance',
  // payroll
  // NOTE: 'overview' is shared with my-work — keep null (module rail + route guard decide).
  overview: null,
  monthly: 'payroll',
  run: 'payroll',
  salary: 'salary',
  history: 'payroll',
  // my-work (self-service — always visible)
  'my-attendance': null,
  'my-leave': null,
  'my-tasks': null,
  'my-requests': null,
  'bank-details': null,
  // approvals ('center' is shared with notifications — keep null, route guards decide)
  center: null,
  pending: 'approval',
  // notifications ('settings' is shared with admin — keep null, route guards decide)
  sent: 'notification',
  compose: 'notification',
  settings: null,
  templates: 'notification',
  preferences: 'notification',
  // admin
  users: 'user',
  roles: 'role',
  'attendance-settings': 'attendance',
  'leave-settings': 'leave_policy',
  audit: 'audit',
  security: 'org_settings',
}
