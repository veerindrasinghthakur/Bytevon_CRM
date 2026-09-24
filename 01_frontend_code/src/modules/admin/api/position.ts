/**
 * Position API — admin organization domain (workforce positions).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type { PositionRow } from '@/shared/schema'
import { asList } from './_org-helpers'

export async function getPositions(params?: { includeArchived?: boolean }) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().positions.map((r) => ({ ...r }) as PositionRow)
    if (!params?.includeArchived) items = items.filter((p) => !p.is_archived)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<PositionRow[] | { items: PositionRow[]; total: number }>(
    '/workforce/positions',
    { params },
  )
  return asList(data)
}

export async function getPosition(
  id: number,
  opts?: { includeArchived?: boolean },
): Promise<PositionRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().positions.find((p) => p.id === id)
    return row ? { ...row } : null
  }
  try {
    const { data } = await apiClient.get<PositionRow>(`/workforce/positions/${id}`, {
      params: opts?.includeArchived ? { include_archived: true } : undefined,
    })
    return data
  } catch (err) {
    // Archived rows 404 by default — retry with include_archived before giving up.
    if (!opts?.includeArchived && isNotFound(err)) {
      const { data } = await apiClient.get<PositionRow>(`/workforce/positions/${id}`, {
        params: { include_archived: true },
      })
      return data
    }
    throw err
  }
}

export async function createPosition(input: { name: string }): Promise<PositionRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().positions as PositionRow[]
    const now = new Date().toISOString()
    const row: PositionRow = {
      id: nextId(list),
      name: input.name.trim(),
      is_archived: false,
      created_at: now,
      updated_at: now,
    }
    list.push(row)
    return { ...row }
  }
  const { data } = await apiClient.post<PositionRow>('/workforce/positions', input)
  return data
}

export async function updatePosition(
  id: number,
  patch: Partial<Pick<PositionRow, 'name' | 'is_archived'>>,
): Promise<PositionRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = (getDb().positions as PositionRow[]).find((p) => p.id === id)
    if (!row) throw new Error('Position not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const { data } = await apiClient.patch<PositionRow>(`/workforce/positions/${id}`, patch)
  return data
}

export async function deletePosition(id: number): Promise<void> {
  if (!env.useMockApi) {
    await apiClient.delete(`/workforce/positions/${id}`)
    return
  }
  return updatePosition(id, { is_archived: true }).then(() => undefined)
}

/** Q16: restore an archived position (real backend only). */
export async function restorePosition(id: number): Promise<PositionRow> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<PositionRow>(`/workforce/positions/${id}/restore`)
    return data
  }
  return updatePosition(id, { is_archived: false })
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  )
}

/** @deprecated Use deletePosition. */
export async function archivePosition(id: number): Promise<void> {
  return deletePosition(id)
}
