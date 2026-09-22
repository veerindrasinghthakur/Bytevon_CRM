export type {
  EffectiveAuthorization,
  PermissionsMap,
  ResourcePermissionFlags,
  PermissionActionKey,
  ScopeByResource,
} from './types'
export {
  emptyPermissions,
  fullPermissions,
  actionToKey,
  keyToAction,
  PERMISSION_ACTION_KEYS,
} from './types'

export { getCurrentEmploymentId, setCurrentEmploymentId } from './session'
export { fetchEffectiveAuthorization, fetchResources, type BackendResource } from './api'
export { buildEffectiveAuthorization } from './build-effective'
export { canWith, hasPermission, type CanArgs } from './can'
export { useRbac, invalidateRbac, type UseRbacResult } from './use-rbac'
export { Can } from './Can.tsx'
export { requirePermission, requireView, type RequirePermissionOpts } from './require-permission'

export {
  filterRailItems,
  filterSecondaryNavItems,
  filterSecondaryNavGroups,
  RAIL_RESOURCE_BY_ID,
  SECONDARY_RESOURCE_BY_ID,
} from './nav'
export {
  dataScope,
  dataScopeFor,
  withScope,
  withAuthScope,
  type ScopedListParams,
} from './scope'

/** @deprecated Prefer useRbac().can */
export { useCanLegacy as useCan } from './legacy'
/** @deprecated Prefer useRbac().can / canWith */
export { canLegacy as can } from './legacy'
