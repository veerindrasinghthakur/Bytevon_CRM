/**
 * Department API — admin domain (/admin/departments).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb } from '@/shared/mock/db'
import { asList } from './_org-helpers'

export async function getSchemaDepartments() {
  if (env.useMockApi) {
    await delay()
    const items = getDb().schema_departments.map((r) => ({ ...r }))
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<unknown[] | { items: unknown[]; total: number }>(
    '/admin/departments',
  )
  return asList(data)
}
