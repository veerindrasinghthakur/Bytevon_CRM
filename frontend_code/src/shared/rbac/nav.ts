/**
 * Navigation filtering helpers — modules/AppShell opt in when ready.
 * Does not mutate DEFAULT_RAIL_ITEMS; returns filtered copies.
 */
import type { RailItem, SecondaryNavGroup, SecondaryNavItem } from '@/shared/types'
import type { ResourceName } from '@/shared/schema'
import { ResourceName as R } from '@/shared/schema'
import type { EffectiveAuthorization } from './types'
import { canWith } from './can'

/** Map primary rail module id → resource used for VIEW gate */
export const RAIL_RESOURCE_BY_ID: Record<string, ResourceName | null> = {
  dashboard: null, // always visible when authenticated
  'my-work': null, // self-service always visible
  sales: R.LEAD,
  projects: R.PROJECT,
  workforce: R.EMPLOYMENT,
  payroll: R.PAYROLL,
  approvals: R.APPROVAL,
  admin: R.ROLE,
  notifications: R.NOTIFICATION,
  profile: null,
}

export function filterRailItems(
  items: RailItem[],
  auth: EffectiveAuthorization | null | undefined,
): RailItem[] {
  return items
    .map((item) => {
      const resource = RAIL_RESOURCE_BY_ID[item.id]
      if (resource == null) {
        return { ...item, visible: item.visible !== false }
      }
      const allowed = canWith(auth, { action: 'VIEW', resource })
      return { ...item, visible: allowed && item.visible !== false }
    })
    .filter((item) => item.visible !== false)
}

export function filterSecondaryNavItems(
  items: SecondaryNavItem[],
  auth: EffectiveAuthorization | null | undefined,
  resourceForItem: (item: SecondaryNavItem) => ResourceName | null,
): SecondaryNavItem[] {
  return items.filter((item) => {
    if (item.visible === false) return false
    const resource = resourceForItem(item)
    if (resource == null) return true
    return canWith(auth, { action: 'VIEW', resource })
  })
}

export function filterSecondaryNavGroups(
  groups: SecondaryNavGroup[],
  auth: EffectiveAuthorization | null | undefined,
  resourceForItem: (item: SecondaryNavItem) => ResourceName | null,
): SecondaryNavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: filterSecondaryNavItems(g.items, auth, resourceForItem),
    }))
    .filter((g) => g.items.length > 0)
}
