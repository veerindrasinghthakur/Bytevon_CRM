/**
 * Sales dashboard metrics API.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { dashboardMetrics } from '../data/mock'
import type { SalesMetric } from '../types'

export async function getDashboardMetrics(): Promise<SalesMetric[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<SalesMetric[]>('/sales/metrics/dashboard')
    return Array.isArray(data) ? data : []
  }
  await delay()
  return dashboardMetrics
}
