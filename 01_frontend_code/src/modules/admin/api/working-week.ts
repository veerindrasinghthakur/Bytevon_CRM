/**
 * Working week API — admin domain (/admin/working-weeks).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type { WorkingWeekRow } from '@/shared/schema'
import { asList } from './_org-helpers'

export async function getWorkingWeeks() {
  if (env.useMockApi) {
    await delay()
    const items = getDb().working_weeks.map((r) => ({ ...r }) as WorkingWeekRow)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<WorkingWeekRow[] | { items: WorkingWeekRow[]; total: number }>(
    '/admin/working-weeks',
  )
  return asList(data)
}

export async function createWorkingWeek(input: {
  name: string
  working_days_of_week: number[]
  effective_from: string
}): Promise<WorkingWeekRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().working_weeks as WorkingWeekRow[]
    const row: WorkingWeekRow = {
      id: nextId(list),
      name: input.name.trim(),
      working_days_of_week: [...input.working_days_of_week],
      effective_from: input.effective_from,
      effective_to: null,
      created_at: new Date().toISOString(),
      created_by: 1,
    }
    for (const w of list) {
      if (w.effective_to == null) {
        w.effective_to = input.effective_from
      }
    }
    list.push(row)
    return { ...row }
  }
  const { data } = await apiClient.post<WorkingWeekRow>('/admin/working-weeks', {
    name: input.name.trim(),
    working_days_of_week: input.working_days_of_week,
    effective_from: input.effective_from,
  })
  return data
}

export async function archiveWorkingWeek(id: number, effectiveTo?: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const row = (getDb().working_weeks as WorkingWeekRow[]).find((w) => w.id === id)
    if (!row) throw new Error('Working week not found')
    row.effective_to = effectiveTo ?? new Date().toISOString().slice(0, 10)
    return
  }
  await apiClient.post(`/admin/working-weeks/${id}/archive`, null, {
    params: effectiveTo ? { effective_to: effectiveTo } : undefined,
  })
}

export async function deleteWorkingWeek(id: number): Promise<void> {
  return archiveWorkingWeek(id)
}
