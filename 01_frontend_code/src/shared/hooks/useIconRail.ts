import { useRouterState } from '@tanstack/react-router'
import type { RailItem } from '@/shared/types'
import { useRbac } from '@/shared/rbac'
import { filterRailItems } from '@/shared/rbac'

export function isRailItemActive(pathname: string, to: string): boolean {
  if (to === '/dashboard') return pathname === '/dashboard' || pathname === '/'
  return pathname === to || pathname.startsWith(to + '/')
}

export function useIconRail(items: RailItem[]) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { auth, isLoading } = useRbac()
  // While permissions load, fall back to the static visible flag so the rail
  // never flashes empty on refresh. Once loaded, RBAC is the source of truth.
  const visibleItems = isLoading
    ? items.filter((i) => i.visible !== false)
    : filterRailItems(items, auth)

  return {
    pathname,
    visibleItems,
    isActive: (to: string) => isRailItemActive(pathname, to),
  }
}
