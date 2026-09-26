/**
 * Dashboard module types — the ONLY home for named types/interfaces in this module.
 * Pure moves from api/dashboard.ts, catalog.ts, calendar.ts, pages + hooks (zero logic change).
 */
import type { Action as ActionType } from '@/shared/schema'
import type {
  employeeKpis,
  employeeLeaveSummary,
  employeeMeta,
  employeeTasks,
  executiveActivities,
  executiveKpis,
  executiveMeta,
  executivePending,
  executiveQuickActions,
  employeeQuickActions,
} from '../data/mock'
import type { ReactElement } from 'react'

/* Catalog gates (moved from catalog.ts) */

export type DashboardGate = {
  /** null = always visible when authenticated; else backend resource name */
  resource: string | null
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

/* Calendar (moved from calendar.ts) */

export type CalendarCell = {
  key: string
  day: number | null
  isToday: boolean
}

/* API aggregates (moved from api/dashboard.ts) */

export type ExecutiveDashboardData = {
  kpis: typeof executiveKpis
  pending: typeof executivePending
  activities: typeof executiveActivities
  meta: typeof executiveMeta
  quickActions: typeof executiveQuickActions
}

export type EmployeeDashboardData = {
  kpis: typeof employeeKpis
  tasks: typeof employeeTasks
  leaveSummary: typeof employeeLeaveSummary
  meta: typeof employeeMeta
  quickActions: typeof employeeQuickActions
}

export type DashboardAttendanceParams = {
  employment_id?: number
  from_date?: string
  to_date?: string
  year?: number
  month?: number
}

/* Week bars (moved from pages/EmployeeDashboardPage.tsx + hooks/use-week-bars.tsx; deduped — identical twins) */

export type BreakMarker = {
  id: string
  startPct: number
  endPct?: number
}

export type WeekBarData =
  | number
  | {
      pct: number
      isWeekend?: boolean
      breakMarkers?: BreakMarker[]
    }

export type EmployeeMeta = {
  name: string
  employeeId: string
  department: string
  todayLabel: string
  shift: string
  checkIn: string
  checkInNote: string
  totalHours: string
  totalHoursNote: string
  weekBars: WeekBarData[]
}

export interface UseWeekBarsOptions {
  weekBars: WeekBarData[]
  todayIndex: number
}

export interface UseWeekBarsReturn {
  weekBarElements: ReactElement[]
}
