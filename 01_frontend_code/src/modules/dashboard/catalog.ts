/**
 * Home (/dashboard) catalog — quick actions, KPIs, sections gated by RBAC.
 * Employee self-service is primarily under My Work; a few self tiles may still appear.
 */
import { Action, ResourceName } from '@/shared/schema'
import type { Action as ActionType, ResourceName as ResourceNameType } from '@/shared/schema'

export type DashboardGate = {
  /** null = always visible when authenticated */
  resource: ResourceNameType | null
  action?: ActionType | string
  /** Optional minimum scope (e.g. TEAM for team attendance) */
  minScope?: string
}

export type DashboardQuickAction = DashboardGate & {
  id: string
  label: string
  icon: string
  to: string
  /** Prefer lower numbers first; self-service first */
  priority: number
}

export type DashboardKpiDef = DashboardGate & {
  id: string
  /** Matches mock KPI label from API when present */
  label: string
  icon: string
}

export type DashboardSectionId =
  | 'attendance_trend'
  | 'pipeline_trend'
  | 'pending_approvals'
  | 'activity_feed'
  | 'calendar'
  | 'sales_snapshot'
  | 'projects_snapshot'
  | 'payroll_snapshot'

export type DashboardSectionDef = DashboardGate & {
  id: DashboardSectionId
  title: string
}

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
    resource: ResourceName.LEAVE_REQUEST,
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
    resource: ResourceName.LEAD,
    action: Action.CREATE,
  },
  {
    id: 'new-client',
    label: 'New client',
    icon: 'domain_add',
    to: '/sales/clients/new',
    priority: 50,
    resource: ResourceName.CLIENT,
    action: Action.CREATE,
  },
  {
    id: 'new-project',
    label: 'New project',
    icon: 'create_new_folder',
    to: '/projects/new',
    priority: 60,
    resource: ResourceName.PROJECT,
    action: Action.CREATE,
  },
  {
    id: 'new-task',
    label: 'New task',
    icon: 'assignment',
    to: '/projects/tasks/new',
    priority: 70,
    resource: ResourceName.TASK,
    action: Action.CREATE,
  },
  {
    id: 'add-employee',
    label: 'Add employee',
    icon: 'person_add',
    to: '/workforce/employees/new',
    priority: 80,
    resource: ResourceName.EMPLOYMENT,
    action: Action.CREATE,
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: 'fact_check',
    to: '/approvals/pending',
    priority: 90,
    resource: ResourceName.APPROVAL,
    action: Action.VIEW,
  },
  {
    id: 'payroll-review',
    label: 'Payroll',
    icon: 'payments',
    to: '/payroll',
    priority: 100,
    resource: ResourceName.PAYROLL,
    action: Action.VIEW,
  },
  {
    id: 'workforce',
    label: 'Employees',
    icon: 'groups',
    to: '/workforce/employees',
    priority: 110,
    resource: ResourceName.EMPLOYMENT,
    action: Action.VIEW,
  },
  {
    id: 'attendance-org',
    label: 'Attendance',
    icon: 'how_to_reg',
    to: '/workforce/attendance',
    priority: 120,
    resource: ResourceName.ATTENDANCE,
    action: Action.VIEW,
  },
]

export const HOME_KPI_DEFS: DashboardKpiDef[] = [
  {
    id: 'employees',
    label: 'Employees',
    icon: 'groups',
    resource: ResourceName.EMPLOYMENT,
    action: Action.VIEW,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: 'how_to_reg',
    resource: ResourceName.ATTENDANCE,
    action: Action.VIEW,
  },
  {
    id: 'leave',
    label: 'Leave Requests',
    icon: 'event_busy',
    resource: ResourceName.LEAVE_REQUEST,
    action: Action.VIEW,
  },
  {
    id: 'tasks',
    label: 'Open Tasks',
    icon: 'task_alt',
    resource: ResourceName.TASK,
    action: Action.VIEW,
  },
  // Replaces generic "Revenue" with sales-shaped metric when lead VIEW
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: 'trending_up',
    resource: ResourceName.LEAD,
    action: Action.VIEW,
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: 'payments',
    resource: ResourceName.PAYROLL,
    action: Action.VIEW,
  },
]

export const HOME_SECTIONS: DashboardSectionDef[] = [
  {
    id: 'attendance_trend',
    title: 'Attendance trend',
    resource: ResourceName.ATTENDANCE,
    action: Action.VIEW,
  },
  {
    id: 'pipeline_trend',
    title: 'Pipeline trend',
    resource: ResourceName.LEAD,
    action: Action.VIEW,
  },
  {
    id: 'pending_approvals',
    title: 'Pending approvals',
    resource: ResourceName.APPROVAL,
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
