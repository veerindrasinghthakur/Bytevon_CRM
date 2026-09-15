import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { computeKpis, periodMeta, recentActivity } from '@/shared/mock/data/payroll'
import type { PayrollActivity, PayrollKpis, PayrollPeriodMeta } from '../types'
import { normalizeActivity, normalizeKpis, normalizePeriod } from './_helpers'

export async function getPayrollKpis(): Promise<PayrollKpis> {
  if (env.useMockApi) {
    await delay(200)
    return computeKpis()
  }
  const { data } = await apiClient.get<Record<string, unknown>>('/payroll/kpis')
  return normalizeKpis(data)
}

export async function getPayrollPeriodMeta(): Promise<PayrollPeriodMeta> {
  if (env.useMockApi) {
    await delay(200)
    return { ...periodMeta }
  }
  const { data } = await apiClient.get<Record<string, unknown>>('/payroll/period')
  return normalizePeriod(data)
}

export async function listPayrollActivity(): Promise<PayrollActivity[]> {
  if (env.useMockApi) {
    await delay(200)
    return recentActivity.map((a) => ({ ...a }))
  }
  const { data } = await apiClient.get<unknown>('/payroll/activity')
  return normalizeActivity(data)
}
