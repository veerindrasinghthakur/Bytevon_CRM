/**
 * Dashboard module API — executive / employee aggregates.
 * Static navigation labels stay in pages; server metrics come from here.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import {
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

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

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

export async function getExecutiveDashboard(): Promise<ExecutiveDashboardData> {
  if (env.useMockApi) {
    await delay()
    return {
      kpis: executiveKpis.map((k) => ({ ...k })),
      pending: executivePending.map((p) => ({ ...p })),
      activities: executiveActivities.map((a) => ({ ...a })),
      meta: {
        ...executiveMeta,
        attendanceBars: [...executiveMeta.attendanceBars],
        revenueBars: [...executiveMeta.revenueBars],
        months: [...executiveMeta.months],
      },
      quickActions: executiveQuickActions.map((q) => ({ ...q })),
    }
  }
  const { data } = await apiClient.get<ExecutiveDashboardData>('/dashboard/executive')
  // Backend returns live aggregations { kpis, pending, activities, meta, ... }.
  // Normalize defensively so the page always has a complete shape.
  const raw = data as unknown as Record<string, unknown>
  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
  const serverMeta =
    raw.meta && typeof raw.meta === 'object'
      ? (raw.meta as Record<string, unknown>)
      : {}
  const today = new Date()
  const dateLine = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const numList = (v: unknown, fallback: number[]): number[] =>
    Array.isArray(v) && v.every((n) => typeof n === 'number') ? (v as number[]) : fallback
  const strList = (v: unknown, fallback: string[]): string[] =>
    Array.isArray(v) && v.every((s) => typeof s === 'string') ? (v as string[]) : fallback
  return {
    kpis: asArray(raw.kpis ?? (data as { kpis?: unknown }).kpis),
    pending: asArray(raw.pending),
    activities: asArray(raw.recentActivities ?? raw.activities),
    meta: {
      ...executiveMeta,
      greetingName: String(serverMeta.greetingName ?? 'there'),
      dateLine: String(serverMeta.dateLine ?? dateLine),
      activeUsers: String(serverMeta.activeUsers ?? executiveMeta.activeUsers),
      presentToday: String(serverMeta.presentToday ?? executiveMeta.presentToday),
      attendanceBars: numList(serverMeta.attendanceBars, [...executiveMeta.attendanceBars]),
      revenueBars: numList(serverMeta.revenueBars, [...executiveMeta.revenueBars]),
      months: strList(serverMeta.months, [...executiveMeta.months]),
    },
    quickActions: executiveQuickActions.map((q) => ({ ...q })),
  } as unknown as ExecutiveDashboardData
}

export type DashboardAttendanceParams = {
  employment_id?: number
  from_date?: string
  to_date?: string
  year?: number
  month?: number
}

export async function getDashboardAttendance(params: DashboardAttendanceParams = {}) {
  const { data } = await apiClient.get('/dashboard/attendance', { params })
  return data
}

export async function getEmployeeDashboard(): Promise<EmployeeDashboardData> {
  if (env.useMockApi) {
    await delay()
    return {
      kpis: employeeKpis.map((k) => ({ ...k })),
      tasks: employeeTasks.map((t) => ({ ...t })),
      leaveSummary: employeeLeaveSummary.map((l) => ({ ...l })),
      meta: { ...employeeMeta, weekBars: [...employeeMeta.weekBars] },
      quickActions: employeeQuickActions.map((q) => ({ ...q })),
    }
  }
  const { data } = await apiClient.get<EmployeeDashboardData>('/dashboard/employee')
  const raw = data as unknown as Record<string, unknown>
  const asArray = <T,>(v: unknown, fallback: T[]): T[] =>
    Array.isArray(v) ? (v as T[]) : fallback
  const serverMeta =
    raw.meta && typeof raw.meta === 'object'
      ? (raw.meta as Record<string, unknown>)
      : {}
  const str = (v: unknown, fallback: string): string =>
    typeof v === 'string' || typeof v === 'number' ? String(v) : fallback
  const m = employeeMeta
  return {
    kpis: asArray(raw.kpis, []),
    tasks: asArray(raw.tasks, []),
    leaveSummary: asArray(raw.leaveSummary, []),
    meta: {
      ...m,
      name: str(serverMeta.name, 'there'),
      employeeId: str(serverMeta.employeeId, ''),
      department: str(serverMeta.department, ''),
      todayLabel: str(serverMeta.todayLabel, ''),
      shift: str(serverMeta.shift, '—'),
      checkIn: str(serverMeta.checkIn, '—'),
      checkInNote: str(serverMeta.checkInNote, ''),
      totalHours: str(serverMeta.totalHours, '0h'),
      totalHoursNote: str(serverMeta.totalHoursNote, ''),
      weekBars: asArray(serverMeta.weekBars, []),
    },
    quickActions: asArray(raw.quickActions, employeeQuickActions.map((q) => ({ ...q }))),
  } as unknown as EmployeeDashboardData
}

