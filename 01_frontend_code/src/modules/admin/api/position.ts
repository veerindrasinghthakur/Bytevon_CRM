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

export async function getPosition(id: number): Promise<PositionRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().positions.find((p) => p.id === id)
    return row ? { ...row } : null
  }
  const { data } = await apiClient.get<PositionRow>(`/workforce/positions/${id}`)
  return data
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

export async function archivePosition(id: number): Promise<void> {
  return updatePosition(id, { is_archived: true }).then(() => undefined)
}
