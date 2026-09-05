/**
 * Backward-compatible can() / useCan() for gradual migration.
 * Prefer useRbac() for new code.
 */
import { buildEffectiveAuthorization } from './build-effective'
import { canWith } from './can'
import { getCurrentEmploymentId } from './session'
import type { Action, ResourceName, ScopeName } from '@/shared/schema'

export function canLegacy(params: {
  action: Action | string
  resource: ResourceName | string
  minScope?: ScopeName | string
  employmentId?: number
}): boolean {
  const id = params.employmentId ?? getCurrentEmploymentId() ?? 1
  const auth = buildEffectiveAuthorization(id)
  return canWith(auth, params)
}

export function useCanLegacy() {
  return {
    can: (action: Action | string, resource: ResourceName | string, minScope?: ScopeName | string) =>
      canLegacy({ action, resource, minScope }),
    employmentId: getCurrentEmploymentId(),
  }
}
