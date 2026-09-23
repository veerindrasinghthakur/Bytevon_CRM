/**
 * Shift API — workforce domain (/workforce/shifts).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type { ShiftRow } from '@/shared/schema'
import { asList } from '@/modules/admin/api/_org-helpers'

export async function getShifts(params?: { includeArchived?: boolean }) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().shifts.map((r) => ({ ...r }))
    if (!params?.includeArchived) items = items.filter((s) => !s.is_archived)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<ShiftRow[] | { items: ShiftRow[]; total: number }>(
    '/workforce/shifts',
    { params: params?.includeArchived ? { include_archived: true } : undefined },
  )
  return asList(data)
}

export async function getShift(
  id: number,
  opts?: { includeArchived?: boolean },
): Promise<ShiftRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().shifts.find((s) => s.id === id)
    return row ? { ...row } : null
  }
  try {
    const { data } = await apiClient.get<ShiftRow>(`/workforce/shifts/${id}`, {
      params: opts?.includeArchived ? { include_archived: true } : undefined,
    })
    return data
  } catch (err) {
    // Archived rows 404 by default — retry with include_archived before giving up.
    if (!opts?.includeArchived && isNotFound(err)) {
      const { data } = await apiClient.get<ShiftRow>(`/workforce/shifts/${id}`, {
        params: { include_archived: true },
      })
      return data
    }
    throw err
  }
}

export async function createShift(
  input: Omit<ShiftRow, 'id' | 'created_at' | 'updated_at' | 'is_archived' | 'changed_by'>,
): Promise<ShiftRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().shifts as ShiftRow[]
    const row: ShiftRow = {
      ...input,
      id: nextId(list),
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      changed_by: 1,
    }
    list.push(row)
    return { ...row }
  }
  const { data } = await apiClient.post<ShiftRow>('/workforce/shifts', input)
  return data
}

export async function updateShift(id: number, patch: Partial<ShiftRow>): Promise<ShiftRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = (getDb().shifts as ShiftRow[]).find((s) => s.id === id)
    if (!row) throw new Error('Shift not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const { data } = await apiClient.patch<ShiftRow>(`/workforce/shifts/${id}`, patch)
  return data
}

export async function deleteShift(id: number): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const row = (getDb().shifts as ShiftRow[]).find((s) => s.id === id)
    if (!row) throw new Error('Shift not found')
    row.is_archived = true
    return
  }
  await apiClient.delete(`/workforce/shifts/${id}`)
}

/** Q16: restore an archived shift (real backend only). */
export async function restoreShift(id: number): Promise<ShiftRow> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<ShiftRow>(`/workforce/shifts/${id}/restore`)
    return data
  }
  await delay(300)
  const row = (getDb().shifts as ShiftRow[]).find((s) => s.id === id)
  if (!row) throw new Error('Shift not found')
  row.is_archived = false
  return { ...row }
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  )
}

/** @deprecated Use deleteShift (DELETE verb + soft-delete). */
export async function archiveShift(id: number): Promise<void> {
  return deleteShift(id)
}

