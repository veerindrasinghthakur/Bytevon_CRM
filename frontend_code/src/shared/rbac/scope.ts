/**
 * Scope helpers for data APIs — FE suggests boundary; BE remains authoritative.
 */
import type { ScopeName } from '@/shared/schema'
import type { EffectiveAuthorization, ScopeByResource } from './types'
import type { ResourceName } from '@/shared/schema'

export type ScopedListParams = {
  /** Data boundary for the request (never trusted by backend alone) */
  scope?: ScopeName
  [key: string]: unknown
}

/** Overall scope from effective auth (default for list calls). */
export function dataScope(auth: EffectiveAuthorization | null | undefined): ScopeName {
  return auth?.scope ?? ('SELF' as ScopeName)
}

/** Prefer per-resource scope when present, else overall. */
export function dataScopeFor(
  auth: EffectiveAuthorization | null | undefined,
  resource: ResourceName | string,
): ScopeName {
  if (!auth) return 'SELF' as ScopeName
  const byRes = auth.scopeByResource?.[resource as ResourceName]
  return byRes ?? auth.scope
}

/** Merge scope into list/filter params without overwriting explicit caller scope. */
export function withScope<
  T extends Record<string, unknown>,
>(params: T, scope: ScopeName | undefined): T & ScopedListParams {
  if (scope == null) return { ...params }
  if (params.scope != null) return { ...params }
  return { ...params, scope }
}

export function withAuthScope<
  T extends Record<string, unknown>,
>(
  params: T,
  auth: EffectiveAuthorization | null | undefined,
  resource?: ResourceName | string,
): T & ScopedListParams {
  const scope = resource ? dataScopeFor(auth, resource) : dataScope(auth)
  return withScope(params, scope)
}

export type { ScopeByResource }
