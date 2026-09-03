import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { paginateItems } from '@/shared/lib/list-params'
import {
  leaveLedger,
  leavePolicies,
  leaveTypeSettings,
} from '../data/mock'
import type { LeaveLedgerRow, LeavePolicyRow, LeaveTypeSettingRow } from '../types'
import { delay} from '@/shared/mock/db'


export async function listLeaveTypeSettings(): Promise<LeaveTypeSettingRow[]> {
  if (env.useMockApi) {
    await delay()
    return leaveTypeSettings.map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<LeaveTypeSettingRow[]>('/admin/leave/types')
  return data
}

export async function listLeavePolicies(params?: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<LeavePolicyRow[]> {
  if (env.useMockApi) {
    await delay()
    let items = leavePolicies.map((r) => ({ ...r }))
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.leave_type.toLowerCase().includes(q),
      )
    }
    if (params?.page != null || params?.pageSize != null) {
      return paginateItems(items, params.page, params.pageSize).items
    }
    return items
  }
  const { data } = await apiClient.get<
    LeavePolicyRow[] | { items: LeavePolicyRow[]; total: number }
  >('/admin/leave/policies', { params })
  // Normalize: backend may return a bare array or a paginated envelope.
  return Array.isArray(data) ? data : data.items
}

export async function listLeaveLedger(
  employeeId?: string,
  params?: { page?: number; pageSize?: number },
): Promise<LeaveLedgerRow[]> {
  if (env.useMockApi) {
    await delay()
    const items = leaveLedger.map((r) => ({ ...r }))
    if (params?.page != null || params?.pageSize != null) {
      return paginateItems(items, params.page, params.pageSize).items
    }
    return items
  }
  const { data } = await apiClient.get<
    LeaveLedgerRow[] | { items: LeaveLedgerRow[]; total: number }
  >('/admin/leave/ledger', {
    params: {
      ...(employeeId ? { employeeId } : {}),
      ...params,
    },
  })
  // Normalize: backend may return a bare array or a paginated envelope.
  return Array.isArray(data) ? data : data.items
}
