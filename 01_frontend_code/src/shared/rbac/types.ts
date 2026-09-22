/**
 * Effective authorization types — locked for frontend RBAC.
 *
 * Permission = WHAT (boolean tree keyed by backend resource name + action)
 * Scope      = WHERE (ScopeName value; max overall + optional per-resource)
 *
 * Resource names are dynamic strings from the backend `resources` table —
 * never a frontend enum.
 */
import type { Action, ResourceName, ScopeName } from '@/shared/schema'

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

/** Resource keys are dynamic backend names — no enumeration here. */
export type PermissionsMap = Partial<Record<string, ResourcePermissionFlags>>

/** Per-resource data boundary (max scope granted for that resource across actions). */
export type ScopeByResource = Partial<Record<string, ScopeName>>

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

/** Empty deny-all baseline (no resource enumeration — grants add keys). */
export function emptyPermissions(): PermissionsMap {
  return {}
}

/** Super-admin baseline — canWith() short-circuits on isSuperAdmin first. */
export function fullPermissions(): PermissionsMap {
  return {}
}

export type { Action, ResourceName, ScopeName }
