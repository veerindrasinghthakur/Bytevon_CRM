import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

/** Horizontal icon tabs — Calendars holds holidays inside. No vertical scrollbar. */
export const ADMIN_SETTINGS_NAV = [
  { id: 'organization', label: 'Organization', icon: 'corporate_fare', to: '/admin/settings' },
  { id: 'head-office', label: 'Head Office', icon: 'location_city', to: '/admin/settings/head-office' },
  { id: 'locations', label: 'Locations', icon: 'apartment', to: '/admin/settings/locations' },
  { id: 'shifts', label: 'Shifts', icon: 'schedule', to: '/admin/settings/shifts' },
  { id: 'working-weeks', label: 'Working Weeks', icon: 'date_range', to: '/admin/settings/working-weeks' },
  { id: 'calendars', label: 'Calendars', icon: 'calendar_month', to: '/admin/settings/holidays' },
  { id: 'positions', label: 'Positions', icon: 'work', to: '/admin/settings/positions' },
  { id: 'branding', label: 'Branding', icon: 'palette', to: '/admin/settings/branding' },
  { id: 'regional', label: 'Regional', icon: 'language', to: '/admin/settings/regional' },
] as const

export function AdminSettingsNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isActive = (to: string) => {
    if (to === '/admin/settings') {
      return pathname === '/admin/settings' || pathname === '/admin/settings/'
    }
    if (to === '/admin/settings/locations') {
      return (
        pathname === '/admin/settings/locations' ||
        pathname.startsWith('/admin/settings/locations/') ||
        pathname.startsWith('/admin/settings/offices/')
      )
    }
    if (to === '/admin/settings/holidays') {
      return pathname === '/admin/settings/holidays' || pathname.startsWith('/admin/settings/holidays/')
    }
    if (to === '/admin/settings/shifts') {
      return pathname === '/admin/settings/shifts' || pathname.startsWith('/admin/settings/shifts/')
    }
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <nav
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-x-auto overflow-y-hidden scrollbar-hide"
      aria-label="Settings sections"
      style={{ scrollbarWidth: 'none' }}
    >
      <ul className="flex flex-row items-stretch justify-start md:justify-between min-w-0">
        {ADMIN_SETTINGS_NAV.map((item) => {
          const active = isActive(item.to)
          return (
            <li key={item.id} className="shrink-0 flex-1 min-w-0">
              <Link
                to={item.to as never}
                title={item.label}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] border-b-2 transition-colors duration-200',
                  active
                    ? 'border-secondary text-secondary font-semibold bg-secondary/5'
                    : 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-background',
                )}
              >
                <span
                  className="material-symbols-outlined text-[22px] shrink-0"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="truncate max-w-full hidden sm:block">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
