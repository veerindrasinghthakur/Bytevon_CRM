/**
 * Route-level authorization for TanStack Router beforeLoad.
 */
import { redirect } from '@tanstack/react-router'
import type { Action, ResourceName, ScopeName } from '@/shared/schema'
import { canWith } from './can'
import type { EffectiveAuthorization } from './types'
import { fetchEffectiveAuthorization } from './api'
import { getCurrentEmploymentId } from './session'

export type RequirePermissionOpts = {
  action: Action | string
  resource: ResourceName | string
  minScope?: ScopeName | string
  redirectTo?: string
}

export async function requirePermission(opts: RequirePermissionOpts): Promise<EffectiveAuthorization> {
  const employmentId = getCurrentEmploymentId()
  const auth = await fetchEffectiveAuthorization(employmentId)

  if (!canWith(auth, opts)) {
    throw redirect({
      to: opts.redirectTo ?? '/access-denied',
      search: {},
    } as never)
  }
  return auth
}

export function requireView(resource: ResourceName | string, redirectTo?: string) {
  return () => requirePermission({ action: 'VIEW', resource, redirectTo })
}
