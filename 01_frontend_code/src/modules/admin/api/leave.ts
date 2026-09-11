/**
 * Admin leave API.
 * Backend has no /admin/leave/* — use /leave/policies, /leave/ledger/{employmentId}.
 * Leave "types" UI is derived from current policies (one row per leave_type).
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { paginateItems } from '@/shared/lib/list-params'
import {
  leaveLedger,
  leavePolicies,
  leaveTypeSettings,
} from '../data/mock'
import type { LeaveLedgerRow, LeavePolicyRow, LeaveTypeSettingRow } from '../types'
import { delay } from '@/shared/mock/db'

const LEAVE_POLICIES_API = '/leave/policies'

type LeavePolicyApi = {
  id: number
  name: string
  leave_type: string
  annual_entitlement: number | string
  carry_forward_limit?: number | string | null
  effective_from: string
  effective_to?: string | null
  created_at?: string
  changed_by?: number | null
}

function mapPolicy(row: LeavePolicyApi): LeavePolicyRow {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    leave_type: String(row.leave_type ?? ''),
    annual_entitlement: Number(row.annual_entitlement ?? 0),
    carry_forward_limit:
      row.carry_forward_limit == null || row.carry_forward_limit === ''
        ? 0
        : Number(row.carry_forward_limit),
    effective_from: String(row.effective_from ?? '').slice(0, 10),
    effective_to: row.effective_to ? String(row.effective_to).slice(0, 10) : null,
  }
}

function eligibilityStyle(type: string): string {
  const t = type.toUpperCase()
  if (t.includes('SICK')) return 'bg-error/10 text-error'
  if (t.includes('CASUAL')) return 'bg-secondary/15 text-secondary'
  if (t.includes('EARNED') || t.includes('ANNUAL') || t.includes('PAID'))
    return 'bg-tertiary-container/40 text-on-tertiary-container'
  return 'bg-surface-container-high text-on-surface-variant'
}

function policiesToTypeSettings(policies: LeavePolicyRow[]): LeaveTypeSettingRow[] {
  const current = policies.filter((p) => p.effective_to == null)
  const byType = new Map<string, LeavePolicyRow>()
  for (const p of current) {
    if (!byType.has(p.leave_type)) byType.set(p.leave_type, p)
  }
  return Array.from(byType.values()).map((p) => ({
    name: p.name || p.leave_type,
    desc: `${p.leave_type} · carry max ${p.carry_forward_limit ?? 0} days`,
    days: String(p.annual_entitlement),
    eligibility: 'All employees',
    eligibilityStyle: eligibilityStyle(p.leave_type),
  }))
}

export async function listLeaveTypeSettings(): Promise<LeaveTypeSettingRow[]> {
  if (env.useMockApi) {
    await delay()
    return leaveTypeSettings.map((r) => ({ ...r }))
  }
  const policies = await listLeavePolicies()
  return policiesToTypeSettings(policies)
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
    LeavePolicyApi[] | { items: LeavePolicyApi[]; total: number }
  >(LEAVE_POLICIES_API, {
    params: params?.search ? { search: params.search } : undefined,
  })
  let items = (Array.isArray(data) ? data : data.items ?? []).map(mapPolicy)
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

export async function createLeavePolicy(input: {
  name: string
  leave_type: string
  annual_entitlement: number
  carry_forward_limit?: number | null
  effective_from: string
}): Promise<LeavePolicyRow> {
  if (env.useMockApi) {
    await delay(400)
    const row: LeavePolicyRow = {
      id: Date.now(),
      name: input.name,
      leave_type: input.leave_type,
      annual_entitlement: input.annual_entitlement,
      carry_forward_limit: input.carry_forward_limit ?? 0,
      effective_from: input.effective_from,
      effective_to: null,
    }
    leavePolicies.push(row)
    return { ...row }
  }
  const { data } = await apiClient.post<LeavePolicyApi>(LEAVE_POLICIES_API, {
    name: input.name.trim(),
    leave_type: input.leave_type,
    annual_entitlement: input.annual_entitlement,
    carry_forward_limit: input.carry_forward_limit ?? null,
    effective_from: input.effective_from,
  })
  return mapPolicy(data)
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

  // No employment selected → empty list (not an API error)
  if (!employeeId) return []

  const { data } = await apiClient.get<
    Array<Record<string, unknown>> | { items: Array<Record<string, unknown>> }
  >(`/leave/ledger/${employeeId}`, {
    params: { limit: params?.pageSize ?? 200 },
  })
  const raw = Array.isArray(data) ? data : data.items ?? []
  let items: LeaveLedgerRow[] = raw.map((r) => ({
    id: Number(r.id),
    leave_type: String(r.leave_type ?? ''),
    transaction_type: String(r.transaction_type ?? ''),
    days: Number(r.days ?? 0),
    reference_type: String(r.reference_type ?? ''),
    created_at: String(r.created_at ?? ''),
  }))
  if (params?.page != null || params?.pageSize != null) {
    return paginateItems(items, params.page, params.pageSize).items
  }
  return items
}
