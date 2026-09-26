/**
 * Navigation filtering helpers — modules/AppShell opt in when ready.
 * Does not mutate DEFAULT_RAIL_ITEMS; returns filtered copies.
 *
 * Resource names are backend strings (see resource-map.ts) — never an enum.
 */
import type { RailItem, SecondaryNavGroup, SecondaryNavItem } from '@/shared/types'
import type { EffectiveAuthorization } from './types'
import { canWith } from './can'
import {
  RAIL_RESOURCE_BY_ID,
  SECONDARY_ACTION_BY_ID,
  SECONDARY_MIN_SCOPE_BY_ID,
  SECONDARY_RESOURCE_BY_ID,
} from './resource-map'

export {
  RAIL_RESOURCE_BY_ID,
  SECONDARY_ACTION_BY_ID,
  SECONDARY_MIN_SCOPE_BY_ID,
  SECONDARY_RESOURCE_BY_ID,
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
  resourceForItem?: (item: SecondaryNavItem) => string | null,
): SecondaryNavItem[] {
  const resolve = resourceForItem ?? ((item) => SECONDARY_RESOURCE_BY_ID[item.id] ?? null)
  return items.filter((item) => {
    if (item.visible === false) return false
    const resource = resolve(item)
    if (resource == null) return true
    return canWith(auth, {
      action: SECONDARY_ACTION_BY_ID[item.id] ?? 'VIEW',
      resource,
      minScope: SECONDARY_MIN_SCOPE_BY_ID[item.id],
    })
  })
}

export function filterSecondaryNavGroups(
  groups: SecondaryNavGroup[],
  auth: EffectiveAuthorization | null | undefined,
  resourceForItem?: (item: SecondaryNavItem) => string | null,
): SecondaryNavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: filterSecondaryNavItems(g.items, auth, resourceForItem),
    }))
    .filter((g) => g.items.length > 0)
}
