/**
 * Case-study domain API — list with filters + pagination.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import { caseStudies as seedCaseStudies, caseStudyMetrics } from '../data/mock'
import type { CaseStudy, SalesMetric } from '../types'

export async function listCaseStudies(params?: {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<{ items: CaseStudy[]; total: number; metrics: SalesMetric[] }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: CaseStudy[]; total?: number; metrics: SalesMetric[] }>(
      '/sales/case-studies',
      { params },
    )
    return {
      items: data.items ?? [],
      total: data.total ?? data.items?.length ?? 0,
      metrics: data.metrics ?? [],
    }
  }
  await delay()
  let items = [...seedCaseStudies]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (cs) =>
        cs.title.toLowerCase().includes(q) ||
        cs.customer.toLowerCase().includes(q) ||
        cs.industry.toLowerCase().includes(q),
    )
  }
  if (params?.status && params.status !== 'All') {
    items = items.filter((cs) => cs.status === params.status)
  }
  if (params?.page != null || params?.pageSize != null) {
    const page = paginateItems(items, params.page, params.pageSize)
    return { items: page.items, total: page.total, metrics: caseStudyMetrics }
  }
  return { items, total: items.length, metrics: caseStudyMetrics }
}
