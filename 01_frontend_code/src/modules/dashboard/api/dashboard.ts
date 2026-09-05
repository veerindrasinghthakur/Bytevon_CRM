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
  return data
}

