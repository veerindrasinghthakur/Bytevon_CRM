/**
 * Local permission checks against EffectiveAuthorization (no network).
 * Resource names are backend strings — never a frontend enum.
 */
import type { Action, ScopeName } from '@/shared/schema'
import type { EffectiveAuthorization, PermissionActionKey } from './types'
import { actionToKey } from './types'

const SCOPE_RANK: Record<string, number> = {
  SELF: 1,
  TEAM: 2,
  DEPARTMENT: 3,
  LOCATION: 4,
  ORGANIZATION: 5,
  CUSTOM: 0,
}

export type CanArgs = {
  action: Action | string
  resource: string
  minScope?: ScopeName | string
}

export function canWith(
  auth: EffectiveAuthorization | null | undefined,
  args: CanArgs,
): boolean {
  if (!auth) return false
  if (auth.isSuperAdmin) return true

  const resource = args.resource
  const key = actionToKey(args.action) as PermissionActionKey
  const allowed = auth.permissions[resource]?.[key] === true
  if (!allowed) return false

  if (!args.minScope) return true
  const have = auth.scopeByResource[resource] ?? auth.scope
  return (SCOPE_RANK[have] ?? 0) >= (SCOPE_RANK[String(args.minScope)] ?? 0)
}

export function hasPermission(
  auth: EffectiveAuthorization | null | undefined,
  resource: string,
  action: Action | string,
): boolean {
  return canWith(auth, { resource, action })
}
