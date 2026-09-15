/**
 * Notifications — sent domain API.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import { sentNotifications as seedSent } from '@/shared/mock/data/notifications'
import type { SentKpi, SentListResponse, SentNotificationRow } from '../types'

let sentStore: SentNotificationRow[] | null = null

function getSent(): SentNotificationRow[] {
  if (!sentStore) sentStore = seedSent.map((r) => ({ ...r }))
  return sentStore
}

export function computeSentKpis(rows: SentNotificationRow[]): SentKpi[] {
  const total = rows.length
  const delivered = rows.filter((r) => r.status === 'Delivered').length
  const failed = rows.filter((r) => r.status === 'Failed').length
  const rate = total ? ((delivered / total) * 100).toFixed(1) : '0'
  return [
    { id: 'total', label: 'Total Sent', value: String(total), hint: 'In current log', icon: 'send' },
    { id: 'delivery', label: 'Delivery Rate', value: `${rate}%`, hint: '', icon: 'check_circle' },
    { id: 'open', label: 'Delivered', value: String(delivered), hint: 'Successfully received', icon: 'visibility' },
    {
      id: 'failed',
      label: 'Failed Delivery',
      value: String(failed),
      hint: failed ? 'Requires Attention' : 'None',
      icon: 'error',
      danger: failed > 0,
    },
  ]
}

export interface SentListParams {
  search?: string
  typeFilter?: string
  statusFilter?: string
  page?: number
  pageSize?: number
}

export async function listSentNotifications(params: SentListParams = {}): Promise<SentListResponse> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const { search, typeFilter = 'All', statusFilter = 'All' } = params

  if (!env.useMockApi) {
    const { data } = await apiClient.get<SentListResponse>('/notifications/sent', {
      params: { page, pageSize, search, type: typeFilter, status: statusFilter },
    })
    return data
  }

  await delay(200)
  let rows = [...getSent()]
  if (typeFilter !== 'All') rows = rows.filter((r) => r.type === typeFilter)
  if (statusFilter !== 'All') rows = rows.filter((r) => r.status === statusFilter)
  if (search) {
    const q = search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.recipientName.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.recipientContact.toLowerCase().includes(q),
    )
  }
  const { items, total } = paginateItems(rows, page, pageSize)
  return { items, total, page, pageSize }
}

/** Used by compose mock to prepend delivered rows. */
export function _prependSentRows(rows: SentNotificationRow[]): void {
  getSent().unshift(...rows)
}
