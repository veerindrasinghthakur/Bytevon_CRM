/**
 * Home (/dashboard) catalog — quick actions, KPIs, sections gated by RBAC.
 * Employee self-service is primarily under My Work; a few self tiles may still appear.
 */
import { Action } from '@/shared/schema'
import type {
  DashboardGate,
  DashboardKpiDef,
  DashboardQuickAction,
  DashboardSectionDef,
} from '../types/dashboard.types'

/** Max quick-action tiles on the home grid */
export const MAX_QUICK_ACTIONS = 8

export const HOME_QUICK_ACTIONS: DashboardQuickAction[] = [
  // Self (always) — light touch; full UX is My Work
  {
    id: 'mark-attendance',
    label: 'Mark attendance',
    icon: 'fingerprint',
    to: '/my-work/attendance/mark',
    priority: 10,
    resource: null,
  },
  {
    id: 'apply-leave',
    label: 'Apply leave',
    icon: 'event_available',
    to: '/my-work/leave/apply',
    priority: 20,
    resource: 'leave_request',
    action: Action.CREATE,
  },
  {
    id: 'my-tasks',
    label: 'My tasks',
    icon: 'task',
    to: '/my-work/tasks',
    priority: 30,
    resource: null,
  },
  // Domain creates / work
  {
    id: 'new-lead',
    label: 'New lead',
    icon: 'person_search',
    to: '/sales/leads/new',
    priority: 40,
    resource: 'lead',
    action: Action.CREATE,
  },
  {
    id: 'new-client',
    label: 'New client',
    icon: 'domain_add',
    to: '/sales/clients/new',
    priority: 50,
    resource: 'client',
    action: Action.CREATE,
  },
  {
    id: 'new-project',
    label: 'New project',
    icon: 'create_new_folder',
    to: '/projects/new',
    priority: 60,
    resource: 'project',
    action: Action.CREATE,
  },
  {
    id: 'new-task',
    label: 'New task',
    icon: 'assignment',
    to: '/projects/tasks/new',
    priority: 70,
    resource: 'task',
    action: Action.CREATE,
  },
  {
    id: 'add-employee',
    label: 'Add employee',
    icon: 'person_add',
    to: '/workforce/employees/new',
    priority: 80,
    resource: 'employment',
    action: Action.CREATE,
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: 'fact_check',
    to: '/approvals/pending',
    priority: 90,
    resource: 'approval',
    action: Action.VIEW,
  },
  {
    id: 'payroll-review',
    label: 'Payroll',
    icon: 'payments',
    to: '/payroll',
    priority: 100,
    resource: 'payroll',
    action: Action.VIEW,
  },
  {
    id: 'workforce',
    label: 'Employees',
    icon: 'groups',
    to: '/workforce/employees',
    priority: 110,
    resource: 'employment',
    action: Action.VIEW,
  },
  {
    id: 'attendance-org',
    label: 'Attendance',
    icon: 'how_to_reg',
    to: '/workforce/attendance',
    priority: 120,
    resource: 'attendance',
    action: Action.VIEW,
  },
]

export const HOME_KPI_DEFS: DashboardKpiDef[] = [
  {
    id: 'employees',
    label: 'Employees',
    icon: 'groups',
    resource: 'employment',
    action: Action.VIEW,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: 'how_to_reg',
    resource: 'attendance',
    action: Action.VIEW,
  },
  {
    id: 'leave',
    label: 'Leave Requests',
    icon: 'event_busy',
    resource: 'leave_request',
    action: Action.VIEW,
  },
  {
    id: 'tasks',
    label: 'Open Tasks',
    icon: 'task_alt',
    resource: 'task',
    action: Action.VIEW,
  },
  // Replaces generic "Revenue" with sales-shaped metric when lead VIEW
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: 'trending_up',
    resource: 'lead',
    action: Action.VIEW,
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: 'payments',
    resource: 'payroll',
    action: Action.VIEW,
  },
]

export const HOME_SECTIONS: DashboardSectionDef[] = [
  {
    id: 'attendance_trend',
    title: 'Attendance trend',
    resource: 'attendance',
    action: Action.VIEW,
  },
  {
    id: 'pipeline_trend',
    title: 'Pipeline trend',
    resource: 'lead',
    action: Action.VIEW,
  },
  {
    id: 'pending_approvals',
    title: 'Pending approvals',
    resource: 'approval',
    action: Action.VIEW,
  },
  {
    id: 'activity_feed',
    title: 'Recent activities',
    resource: null, // personal-ish feed always on home
  },
  {
    id: 'calendar',
    title: 'Calendar',
    resource: null,
  },
]

export function isGateAllowed(
  gate: DashboardGate,
  can: (action: string, resource: string, minScope?: string) => boolean,
): boolean {
  if (gate.resource == null) return true
  const action = gate.action ?? Action.VIEW
  return can(action, gate.resource, gate.minScope)
}
