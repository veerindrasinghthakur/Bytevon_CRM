import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import {
  leaveLedger,
  leavePolicies,
  leaveTypeSettings,
} from '../data/mock'
import type { LeaveLedgerRow, LeavePolicyRow, LeaveTypeSettingRow } from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function listLeaveTypeSettings(): Promise<LeaveTypeSettingRow[]> {
  if (env.useMockApi) {
    await delay()
    return leaveTypeSettings.map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<LeaveTypeSettingRow[]>('/admin/leave/types')
  return data
}

export async function listLeavePolicies(): Promise<LeavePolicyRow[]> {
  if (env.useMockApi) {
    await delay()
    return leavePolicies.map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<LeavePolicyRow[]>('/admin/leave/policies')
  return data
}

export async function listLeaveLedger(_employeeId?: string): Promise<LeaveLedgerRow[]> {
  if (env.useMockApi) {
    await delay()
    return leaveLedger.map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<LeaveLedgerRow[]>('/admin/leave/ledger', {
    params: _employeeId ? { employeeId: _employeeId } : undefined,
  })
  return data
}
