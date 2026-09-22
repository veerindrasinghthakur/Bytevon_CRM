/**
 * Sales activity timeline API.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { salesActivities as seedActivities } from '../data/mock'
import type { SalesActivity } from '../types'

export async function listSalesActivities(): Promise<SalesActivity[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<SalesActivity[]>('/sales/activity')
    return Array.isArray(data) ? data : []
  }
  await delay()
  return seedActivities
}
