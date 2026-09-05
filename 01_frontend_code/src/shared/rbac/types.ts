/**
 * Effective authorization types — locked for frontend RBAC.
 *
 * Permission = WHAT (boolean tree keyed by ResourceName + action)
 * Scope      = WHERE (ScopeName value; max overall + optional per-resource)
 */
import type { Action, ResourceName, ScopeName } from '@/shared/schema'
import { ResourceName as ResourceEnum } from '@/shared/schema'

/** Action keys on the permissions tree (lowercase, matches DX: permissions.project.update) */
export type PermissionActionKey =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'unlock'

export const PERMISSION_ACTION_KEYS: PermissionActionKey[] = [
  'view',
  'create',
  'update',
  'delete',
  'approve',
  'export',
  'unlock',
]

export function actionToKey(action: Action | string): PermissionActionKey {
  return String(action).toLowerCase() as PermissionActionKey
}

export function keyToAction(key: PermissionActionKey): Action {
  return key.toUpperCase() as Action
}

/** Nested boolean map: permissions.project.view === true */
export type ResourcePermissionFlags = Partial<Record<PermissionActionKey, boolean>>

export type PermissionsMap = {
  [K in ResourceName]?: ResourcePermissionFlags
}

/** Per-resource data boundary (max scope granted for that resource across actions). */
export type ScopeByResource = Partial<Record<ResourceName, ScopeName>>

/**
 * Effective authorization payload (React Query source of truth).
 * Loaded once per employment; modules never re-fetch for can() checks.
 */
export interface EffectiveAuthorization {
  employmentId: number
  /** True when Super Admin (or system bypass) — all permission checks pass. */
  isSuperAdmin: boolean
  /**
   * Boolean permission tree.
   * Prefer: permissions.project?.update === true
   * Or use can('UPDATE', 'project') / can({ action, resource }).
   */
  permissions: PermissionsMap
  /**
   * Default data boundary for list/API calls (max scope across grants).
   * Backend still validates; FE only suggests scope in requests.
   */
  scope: ScopeName
  /** Max scope per resource when grants differ by resource. */
  scopeByResource: ScopeByResource
}

/** Empty deny-all baseline */
export function emptyPermissions(): PermissionsMap {
  const map: PermissionsMap = {}
  for (const r of Object.values(ResourceEnum)) {
    map[r] = Object.fromEntries(PERMISSION_ACTION_KEYS.map((a) => [a, false])) as ResourcePermissionFlags
  }
  return map
}

export function fullPermissions(): PermissionsMap {
  const map: PermissionsMap = {}
  for (const r of Object.values(ResourceEnum)) {
    map[r] = Object.fromEntries(PERMISSION_ACTION_KEYS.map((a) => [a, true])) as ResourcePermissionFlags
  }
  return map
}

export type { Action, ResourceName, ScopeName }
