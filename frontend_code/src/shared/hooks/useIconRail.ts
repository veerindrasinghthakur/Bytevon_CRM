import { useRouterState } from '@tanstack/react-router'
import type { RailItem } from '@/shared/components/layout/IconRail'

export function isRailItemActive(pathname: string, to: string): boolean {
  if (to === '/dashboard') return pathname === '/dashboard' || pathname === '/'
  return pathname === to || pathname.startsWith(to + '/')
}

export function useIconRail(items: RailItem[]) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const visibleItems = items.filter((i) => i.visible !== false)

  return {
    pathname,
    visibleItems,
    isActive: (to: string) => isRailItemActive(pathname, to),
  }
}
