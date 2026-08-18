/**
 * Permission check — resolves role_permissions for current employment.
 * Until backend ships, reads from schema seed via getDb().
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

export function can(params: CanParams): boolean {
  const db = getDb() as ReturnType<typeof getDb> & {
    resources?: { id: number; name: string }[]
    permissions?: { id: number; resource_id: number; action: string }[]
    scopes?: { id: number; name: string }[]
    role_permissions?: { role_id: number; permission_id: number; scope_id: number }[]
    employee_roles?: { employment_id: number; role_id: number }[]
  }

  const employmentId = params.employmentId ?? getCurrentEmploymentId()
  if (employmentId == null) return false

  const roleIds = (db.employee_roles ?? [])
    .filter((er) => er.employment_id === employmentId)
    .map((er) => er.role_id)

  if (roleIds.length === 0) return false

  // Super Admin (role id 1) — full access
  if (roleIds.includes(1)) return true

  const resource = (db.resources ?? []).find((r) => r.name === params.resource)
  if (!resource) return false

  const permission = (db.permissions ?? []).find(
    (p) => p.resource_id === resource.id && p.action === params.action,
  )
  if (!permission) return false

  const grants = (db.role_permissions ?? []).filter(
    (rp) => roleIds.includes(rp.role_id) && rp.permission_id === permission.id,
  )
  if (grants.length === 0) return false

  if (!params.minScope) return true

  const required = SCOPE_RANK[params.minScope] ?? 0
  return grants.some((g) => {
    const scope = (db.scopes ?? []).find((s) => s.id === g.scope_id)
    if (!scope) return false
    return (SCOPE_RANK[scope.name] ?? 0) >= required
  })
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
    return
  }
  localStorage.setItem(EMPLOYMENT_KEY, String(id))
}

export function useCan() {
  return {
    can: (action: Action | string, resource: ResourceName | string, minScope?: ScopeName | string) =>
      can({ action, resource, minScope }),
    employmentId: getCurrentEmploymentId(),
  }
}
