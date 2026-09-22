import { useRouterState } from '@tanstack/react-router'
import { SECONDARY_NAV } from '@/shared/components/layout/SecondarySidebar'
import type { SecondaryNavGroup, SecondaryNavItem } from '@/shared/types'
import { useRbac } from '@/shared/rbac'
import { filterSecondaryNavItems } from '@/shared/rbac'

export function getActiveModule(pathname: string): string {
  if (pathname.startsWith('/sales')) return 'sales'
  if (pathname.startsWith('/projects')) return 'projects'
  if (pathname.startsWith('/workforce')) return 'workforce'
  if (pathname.startsWith('/payroll')) return 'payroll'
  if (pathname.startsWith('/my-work')) return 'my-work'
  if (pathname.startsWith('/approvals')) return 'approvals'
  if (pathname.startsWith('/notifications')) return 'notifications'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/dashboard/')) return 'dashboard'
  if (pathname.startsWith('/profile')) return 'dashboard'
  return 'dashboard'
}

export function isSecondaryItemActive(pathname: string, to: string): boolean {
  if (to === '/sales') {
    return (
      pathname === '/sales' ||
      pathname === '/sales/leads' ||
      pathname.startsWith('/sales/leads/')
    )
  }
  if (to === '/sales/dashboard') {
    return pathname === '/sales/dashboard' || pathname === '/sales/activity'
  }
  if (to === '/projects') return pathname === '/projects'
  if (to === '/projects/teams') {
    return pathname.startsWith('/projects/teams') || pathname.startsWith('/workforce/teams')
  }
  if (to === '/projects/documents') return pathname === '/projects/documents'
  if (to === '/my-work') return pathname === '/my-work'
  if (to === '/approvals') return pathname === '/approvals'
  if (to === '/notifications') {
    return pathname === '/notifications' || pathname === '/notifications/center'
  }
  if (to === '/admin/users') {
    return pathname === '/admin' || pathname === '/admin/users' || pathname.startsWith('/admin/users/')
  }
  if (to === '/admin/settings') {
    return pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')
  }
  if (to === '/admin/leave-settings') {
    return pathname.startsWith('/admin/leave-settings')
  }
  if (to === '/admin/attendance-settings') {
    return pathname.startsWith('/admin/attendance-settings')
  }
  if (to === '/dashboard') return pathname === '/dashboard'
  if (to === '/dashboard/employee') return pathname === '/dashboard/employee'
  if (to === '/payroll') return pathname === '/payroll'
  if (to === '/payroll/history') {
    return pathname === '/payroll/history'
  }
  if (to === '/workforce/shifts') {
    return pathname.startsWith('/workforce/shifts') || pathname.startsWith('/admin/settings/shifts')
  }
  if (to === '/my-work/attendance') {
    return (
      pathname === '/my-work/attendance' ||
      pathname.startsWith('/my-work/attendance/mark') ||
      !!pathname.match(/^\/my-work\/attendance\/[^/]+$/)
    )
  }
  if (to === '/my-work/attendance/corrections') {
    return pathname.startsWith('/my-work/attendance/corrections')
  }
  if (to === '/my-work/requests') {
    return pathname === '/my-work/requests' || pathname.startsWith('/my-work/requests/')
  }
  if (to === '/my-work/bank-details') {
    return pathname === '/my-work/bank-details' || pathname.startsWith('/my-work/bank-details/')
  }
  return pathname === to || pathname.startsWith(to + '/')
}

export function useSecondaryNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const moduleId = getActiveModule(pathname)
  const group: SecondaryNavGroup | undefined = SECONDARY_NAV[moduleId]
  const { auth, isLoading } = useRbac()
  const baseItems: SecondaryNavItem[] = (group?.items ?? []).filter((i) => i.visible !== false)
  // While permissions load, fall back to the static visible flag so the
  // sidebar never flashes empty on refresh. Once loaded, RBAC decides.
  const items = isLoading ? baseItems : filterSecondaryNavItems(baseItems, auth)

  return {
    pathname,
    moduleId,
    group,
    items,
    hasItems: items.length > 0,
    isItemActive: (to: string) => isSecondaryItemActive(pathname, to),
  }
}
