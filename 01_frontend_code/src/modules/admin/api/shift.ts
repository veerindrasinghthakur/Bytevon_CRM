/**
 * Shift API — admin organization domain.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type { ShiftRow } from '@/shared/schema'
import { asList } from './_org-helpers'

export async function getShifts(params?: { includeArchived?: boolean }) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().shifts.map((r) => ({ ...r }))
    if (!params?.includeArchived) items = items.filter((s) => !s.is_archived)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<ShiftRow[] | { items: ShiftRow[]; total: number }>(
    '/organization/shifts',
    { params: params?.includeArchived ? { include_archived: true } : undefined },
  )
  return asList(data)
}

export async function getShift(id: number): Promise<ShiftRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().shifts.find((s) => s.id === id)
    return row ? { ...row } : null
  }
  const { data } = await apiClient.get<ShiftRow>(`/organization/shifts/${id}`)
  return data
}

export async function createShift(
  input: Omit<ShiftRow, 'id' | 'created_at' | 'updated_at' | 'is_archived' | 'changed_by'>,
): Promise<ShiftRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().shifts
    const row: ShiftRow = {
      ...input,
      id: nextId(list),
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      changed_by: 1,
    }
    list.push(row as any)
    return { ...row }
  }
  const { data } = await apiClient.post<ShiftRow>('/organization/shifts', input)
  return data
}

export async function updateShift(id: number, patch: Partial<ShiftRow>): Promise<ShiftRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = getDb().shifts.find((s) => s.id === id)
    if (!row) throw new Error('Shift not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const { data } = await apiClient.patch<ShiftRow>(`/organization/shifts/${id}`, patch)
  return data
}

export async function archiveShift(id: number): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const row = getDb().shifts.find((s) => s.id === id)
    if (!row) throw new Error('Shift not found')
    row.is_archived = true
    return
  }
  await apiClient.post(`/organization/shifts/${id}/archive`)
}
