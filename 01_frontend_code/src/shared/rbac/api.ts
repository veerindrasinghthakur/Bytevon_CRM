/**
 * Effective authorization API — mock vs real.
 */
import { apiClient } from '@/shared/lib/axios'
import { env } from '@/config/env'
import { buildEffectiveAuthorization } from './build-effective'
import type { EffectiveAuthorization } from './types'
import { getCurrentEmploymentId } from './session'

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
