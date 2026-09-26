/**
 * Shared RBAC hook — React Query is the source of truth for effective auth.
 */
import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Action, ResourceName, ScopeName } from '@/shared/schema'
import { queryKeys } from '@/shared/lib/query-keys'
import { fetchEffectiveAuthorization } from './api'
import { canWith, type CanArgs } from './can'
import { getCurrentEmploymentId } from './session'
import type { EffectiveAuthorization } from './types'
import { emptyPermissions } from './types'
import { dataScopeFor, withAuthScope } from './scope'

export type UseRbacResult = {
  permissions: EffectiveAuthorization['permissions']
  scope: ScopeName
  scopeByResource: EffectiveAuthorization['scopeByResource']
  isSuperAdmin: boolean
  employmentId: number | null
  isLoading: boolean
  isError: boolean
  can: (action: Action | string, resource: ResourceName | string, minScope?: ScopeName | string) => boolean
  canDo: (args: CanArgs) => boolean
  refresh: () => Promise<void>
  auth: EffectiveAuthorization | undefined
}

export function useRbac(employmentId?: number | null): UseRbacResult {
  const id = employmentId ?? getCurrentEmploymentId()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.rbac.effective(id),
    queryFn: () => fetchEffectiveAuthorization(id),
    enabled: id != null,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  const auth = query.data

  const can = useCallback(
    (action: Action | string, resource: ResourceName | string, minScope?: ScopeName | string) =>
      canWith(auth, { action, resource, minScope }),
    [auth],
  )

  const canDo = useCallback((args: CanArgs) => canWith(auth, args), [auth])

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.rbac.all })
  }, [qc])

  return useMemo(
    () => ({
      permissions: auth?.permissions ?? emptyPermissions(),
      scope: (auth?.scope ?? 'SELF') as ScopeName,
      scopeByResource: auth?.scopeByResource ?? {},
      isSuperAdmin: auth?.isSuperAdmin ?? false,
      employmentId: id,
      isLoading: query.isLoading,
      isError: query.isError,
      can,
      canDo,
      refresh,
      auth,
    }),
    [auth, id, query.isLoading, query.isError, can, canDo, refresh],
  )
}

/**
 * Data boundary for a resource from effective auth (per-resource max scope,
 * else overall). Backend remains authoritative — this is a request hint
 * that also keeps caches partitioned per boundary.
 */
export function useDataScope(resource: string): ScopeName {
  const { auth } = useRbac()
  return dataScopeFor(auth, resource)
}

/**
 * Merge the caller's data scope into list/filter params without
 * overwriting an explicit caller scope. Pass the result to both the
 * queryKey and the queryFn so caches stay partitioned per boundary.
 */
export function useScopeParams<T extends Record<string, unknown>>(
  resource: string,
  params: T,
): T & { scope: ScopeName } {
  const { auth } = useRbac()
  return withAuthScope(params, auth, resource) as T & { scope: ScopeName }
}

export function invalidateRbac(qc: {
  invalidateQueries: (o: { queryKey: readonly unknown[] }) => unknown
}) {
  void qc.invalidateQueries({ queryKey: queryKeys.rbac.all })
}
