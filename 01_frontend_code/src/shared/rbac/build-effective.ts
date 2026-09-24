/**
 * Build EffectiveAuthorization from mock seed tables (or role templates).
 * Used when env.useMockApi — replaced by GET effective-permissions in real mode.
 * Resource names are backend strings — never a frontend enum.
 */
import { getDb } from '@/shared/mock/db'
import { ScopeName } from '@/shared/schema'
import {
  type EffectiveAuthorization,
  type ScopeByResource,
  emptyPermissions,
  fullPermissions,
  actionToKey,
  PERMISSION_ACTION_KEYS,
} from './types'

const SCOPE_RANK: Record<string, number> = {
  SELF: 1,
  TEAM: 2,
  DEPARTMENT: 3,
  LOCATION: 4,
  ORGANIZATION: 5,
  CUSTOM: 0,
}

const SUPER_ADMIN_ROLE_ID = 1

/** Baseline grants when role_permissions seed is empty — keeps non-admin roles usable. */
const ROLE_TEMPLATES: Record<
  number,
  { resources: string[]; actions: string[]; scope: ScopeName }
> = {
  2: {
    resources: [
      'employment',
      'department',
      'user',
      'leave_request',
      'leave_policy',
      'attendance',
      'salary',
      'role',
      'org_settings',
      'shift',
      'holiday',
      'location',
    ],
    actions: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'UNLOCK'],
    scope: ScopeName.ORGANIZATION,
  },
  3: {
    resources: [
      'employment',
      'attendance',
      'leave_request',
      'task',
      'project',
      'approval',
    ],
    actions: ['VIEW', 'CREATE', 'UPDATE', 'APPROVE'],
    scope: ScopeName.TEAM,
  },
  4: {
    resources: ['payroll', 'salary', 'employment'],
    actions: ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'EXPORT'],
    scope: ScopeName.ORGANIZATION,
  },
  5: {
    resources: [
      'leave_request',
      'attendance',
      'task',
      'notification',
      'document',
      'note',
    ],
    actions: ['VIEW', 'CREATE', 'UPDATE'],
    scope: ScopeName.SELF,
  },
}

function rankOf(scope: string): number {
  return SCOPE_RANK[scope] ?? 0
}

function maxScopeName(a: ScopeName, b: ScopeName): ScopeName {
  return rankOf(a) >= rankOf(b) ? a : b
}

export function buildEffectiveAuthorization(employmentId: number): EffectiveAuthorization {
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
    return {
      employmentId,
      isSuperAdmin: false,
      permissions: emptyPermissions(),
      scope: ScopeName.SELF,
      scopeByResource: {},
    }
  }

  if (roleIds.includes(SUPER_ADMIN_ROLE_ID)) {
    const allOrg: ScopeByResource = {}
    // Resource names come from the mock seed (mirrors backend `resources` table).
    for (const r of db.resources ?? []) {
      allOrg[r.name] = ScopeName.ORGANIZATION
    }
    return {
      employmentId,
      isSuperAdmin: true,
      permissions: fullPermissions(),
      scope: ScopeName.ORGANIZATION,
      scopeByResource: allOrg,
    }
  }

  const permissions = emptyPermissions()
  const scopeByResource: ScopeByResource = {}
  let overall: ScopeName = ScopeName.SELF

  const resourceById = new Map((db.resources ?? []).map((r) => [r.id, r.name]))
  const permissionById = new Map(
    (db.permissions ?? []).map((p) => [p.id, { resourceId: p.resource_id, action: p.action }]),
  )
  const scopeById = new Map((db.scopes ?? []).map((s) => [s.id, s.name as ScopeName]))

  const rolePerms = (db.role_permissions ?? []).filter((rp) => roleIds.includes(rp.role_id))

  if (rolePerms.length > 0) {
    for (const rp of rolePerms) {
      const perm = permissionById.get(rp.permission_id)
      if (!perm) continue
      const resourceName = resourceById.get(perm.resourceId)
      if (!resourceName) continue
      const key = actionToKey(perm.action)
      if (!permissions[resourceName]) permissions[resourceName] = {}
      permissions[resourceName]![key] = true
      const sc = scopeById.get(rp.scope_id) ?? ScopeName.SELF
      const prev = scopeByResource[resourceName]
      scopeByResource[resourceName] = prev ? maxScopeName(prev, sc) : sc
      overall = maxScopeName(overall, sc)
    }
  } else {
    for (const roleId of roleIds) {
      const tpl = ROLE_TEMPLATES[roleId]
      if (!tpl) continue
      for (const resource of tpl.resources) {
        if (!permissions[resource]) permissions[resource] = {}
        for (const action of tpl.actions) {
          const key = actionToKey(action)
          if ((PERMISSION_ACTION_KEYS as string[]).includes(key)) {
            permissions[resource]![key] = true
          }
        }
        const prev = scopeByResource[resource]
        scopeByResource[resource] = prev ? maxScopeName(prev, tpl.scope) : tpl.scope
        overall = maxScopeName(overall, tpl.scope)
      }
    }
  }

  return {
    employmentId,
    isSuperAdmin: false,
    permissions,
    scope: overall,
    scopeByResource,
  }
}
