/**
 * Permission check — resolves role_permissions for current employment.
 * Until backend ships, reads from schema seed via getDb().
 *
 * Effective grants are memoized per employmentId so render-heavy UIs
 * do not re-walk seed tables on every can() call.
 */

import { getDb } from '@/shared/mock/db'
import type { Action, ResourceName, ScopeName } from '@/shared/schema'

export interface CanParams {
  action: Action | string
  resource: ResourceName | string
  /** Minimum scope required; ORGANIZATION satisfies all */
  minScope?: ScopeName | string
  employmentId?: number
}

const SCOPE_RANK: Record<string, number> = {
  SELF: 1,
  TEAM: 2,
  DEPARTMENT: 3,
  LOCATION: 4,
  ORGANIZATION: 5,
  CUSTOM: 0,
}

/** Session employment id — set by auth after login (localStorage). */
const EMPLOYMENT_KEY = 'bytevon_current_employment_id'

export function getCurrentEmploymentId(): number | null {
  try {
    const raw = localStorage.getItem(EMPLOYMENT_KEY)
    if (!raw) return 1 // default Super Admin employment for mock
    const n = Number(raw)
    return Number.isFinite(n) ? n : 1
  } catch {
    return 1
  }
}

export function setCurrentEmploymentId(id: number | null) {
  if (id == null) {
    localStorage.removeItem(EMPLOYMENT_KEY)
  } else {
    localStorage.setItem(EMPLOYMENT_KEY, String(id))
  }
  // Drop cached grants when session employment changes
  clearPermissionCache()
}

type GrantKey = string // `${resource}|${action}`

interface EffectiveGrants {
  /** Super Admin short-circuit */
  isSuperAdmin: boolean
  /** Max scope rank per resource|action */
  maxScopeByGrant: Map<GrantKey, number>
}

const grantsCache = new Map<number, EffectiveGrants>()

export function clearPermissionCache() {
  grantsCache.clear()
}

function buildEffectiveGrants(employmentId: number): EffectiveGrants {
  const db = getDb() as ReturnType<typeof getDb> & {
    resources?: { id: number; name: string }[]
    permissions?: { id: number; resource_id: number; action: string }[]
    scopes?: { id: number; name: string }[]
    role_permissions?: { role_id: number; permission_id: number; scope_id: number }[]
    employee_roles?: { employment_id: number; role_id: number }[]
  }

  const roleIds = (db.employee_roles ?? [])
    .filter((er) => er.employment_id === employmentId)
    .map((er) => er.role_id)

  if (roleIds.length === 0) {
    return { isSuperAdmin: false, maxScopeByGrant: new Map() }
  }

  // Super Admin (role id 1) — full access
  if (roleIds.includes(1)) {
    return { isSuperAdmin: true, maxScopeByGrant: new Map() }
  }

  const resourceById = new Map((db.resources ?? []).map((r) => [r.id, r.name]))
  const permissionById = new Map(
    (db.permissions ?? []).map((p) => [p.id, { resourceId: p.resource_id, action: p.action }]),
  )
  const scopeRankById = new Map(
    (db.scopes ?? []).map((s) => [s.id, SCOPE_RANK[s.name] ?? 0]),
  )

  const maxScopeByGrant = new Map<GrantKey, number>()

  for (const rp of db.role_permissions ?? []) {
    if (!roleIds.includes(rp.role_id)) continue
    const perm = permissionById.get(rp.permission_id)
    if (!perm) continue
    const resourceName = resourceById.get(perm.resourceId)
    if (!resourceName) continue
    const key: GrantKey = `${resourceName}|${perm.action}`
    const rank = scopeRankById.get(rp.scope_id) ?? 0
    const prev = maxScopeByGrant.get(key) ?? 0
    if (rank > prev) maxScopeByGrant.set(key, rank)
  }

  return { isSuperAdmin: false, maxScopeByGrant }
}

function getEffectiveGrants(employmentId: number): EffectiveGrants {
  let cached = grantsCache.get(employmentId)
  if (!cached) {
    cached = buildEffectiveGrants(employmentId)
    grantsCache.set(employmentId, cached)
  }
  return cached
}

export function can(params: CanParams): boolean {
  const employmentId = params.employmentId ?? getCurrentEmploymentId()
  if (employmentId == null) return false

  const grants = getEffectiveGrants(employmentId)
  if (grants.isSuperAdmin) return true

  const key: GrantKey = `${params.resource}|${params.action}`
  const maxRank = grants.maxScopeByGrant.get(key)
  if (maxRank == null) return false

  if (!params.minScope) return true

  const required = SCOPE_RANK[params.minScope] ?? 0
  return maxRank >= required
}

export function useCan() {
  return {
    can: (action: Action | string, resource: ResourceName | string, minScope?: ScopeName | string) =>
      can({ action, resource, minScope }),
    employmentId: getCurrentEmploymentId(),
  }
}
