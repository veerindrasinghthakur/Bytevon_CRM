/**
 * Effective authorization API — mock vs real.
 */
import { env } from '@/config/env'
import { buildEffectiveAuthorization } from './build-effective'
import type { EffectiveAuthorization } from './types'
import { getCurrentEmploymentId } from './session'

async function fetchEffectiveFromApi(employmentId: number): Promise<EffectiveAuthorization> {
  const base = env.apiBaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/rbac/employments/${employmentId}/effective-permissions`, {
    headers: {
      Accept: 'application/json',
      'X-Employment-Id': String(employmentId),
    },
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`Failed to load effective permissions (${res.status})`)
  }
  return (await res.json()) as EffectiveAuthorization
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
