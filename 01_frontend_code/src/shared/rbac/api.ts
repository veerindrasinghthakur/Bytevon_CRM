/**
 * Effective authorization API — mock vs real.
 * Resource names always come from the backend `resources` table (seeded).
 */
import { apiClient } from '@/shared/lib/axios'
import { env } from '@/config/env'
import { buildEffectiveAuthorization } from './build-effective'
import type { EffectiveAuthorization } from './types'
import { getCurrentEmploymentId } from './session'

export type BackendResource = {
  id: number
  name: string
  description: string | null
}

/**
 * Fetch the seeded resource catalog — backend is the single source of truth.
 * Cached with staleTime Infinity; resources change only via backend seeds.
 */
export async function fetchResources(): Promise<BackendResource[]> {
  if (env.useMockApi) {
    const { getDb } = await import('@/shared/mock/db')
    const db = getDb() as unknown as { resources?: BackendResource[] }
    return db.resources ?? []
  }
  const { data } = await apiClient.get<BackendResource[]>('/rbac/resources')
  return data
}

async function fetchEffectiveFromApi(employmentId: number): Promise<EffectiveAuthorization> {
  const { data } = await apiClient.get<EffectiveAuthorization>(
    `/rbac/employments/${employmentId}/effective-permissions`,
    {
      headers: {
        'X-Employment-Id': String(employmentId),
      },
    },
  )
  return data
}

export async function fetchEffectiveAuthorization(
  employmentId?: number | null,
): Promise<EffectiveAuthorization> {
  const id = employmentId ?? getCurrentEmploymentId() ?? 1
  if (env.useMockApi) {
    return buildEffectiveAuthorization(id)
  }
  return fetchEffectiveFromApi(id)
}
