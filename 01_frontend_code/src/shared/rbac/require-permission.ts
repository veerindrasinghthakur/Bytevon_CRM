/**
 * Route-level authorization for TanStack Router beforeLoad.
 *
 * Never lets API failures crash the route tree: 401 → login, 403/404
 * (backend hides grant denials as 404/insufficient_permission) → the
 * access-denied page. Only non-HTTP failures propagate.
 */
import { redirect } from '@tanstack/react-router'
import axios from 'axios'
import type { Action, ResourceName, ScopeName } from '@/shared/schema'
import { canWith } from './can'
import type { EffectiveAuthorization } from './types'
import { fetchEffectiveAuthorization } from './api'
import { getCurrentEmploymentId } from './session'
import { queryClient } from '@/shared/lib/query-client'
import { queryKeys } from '@/shared/lib/query-keys'

export type RequirePermissionOpts = {
  action: Action | string
  resource: ResourceName | string
  minScope?: ScopeName | string
  redirectTo?: string
}

export async function requirePermission(opts: RequirePermissionOpts): Promise<EffectiveAuthorization> {
  const employmentId = getCurrentEmploymentId()
  // Cached via React Query (staleTime Infinity, invalidated on login/logout/
  // expiry) so route guards don't add a request per navigation.
  let auth: EffectiveAuthorization
  try {
    auth = await queryClient.fetchQuery({
      queryKey: queryKeys.rbac.effective(employmentId),
      queryFn: () => fetchEffectiveAuthorization(employmentId),
      staleTime: Infinity,
    })
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      if (status === 401) {
        throw redirect({ to: '/login', search: {} } as never)
      }
      if (status === 403 || status === 404) {
        throw redirect({
          to: opts.redirectTo ?? '/access-denied',
          search: {},
        } as never)
      }
    }
    throw err
  }

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
