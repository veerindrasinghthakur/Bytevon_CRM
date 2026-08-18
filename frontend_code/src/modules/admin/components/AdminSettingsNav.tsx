import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

/** Horizontal (row-wise) admin settings sections */
export const ADMIN_SETTINGS_NAV = [
  { id: 'organization', label: 'Organization', icon: 'corporate_fare', to: '/admin/settings' },
  { id: 'head-office', label: 'Head Office', icon: 'location_city', to: '/admin/settings/head-office' },
  { id: 'locations', label: 'Locations', icon: 'apartment', to: '/admin/settings/locations' },
  { id: 'shifts', label: 'Shifts', icon: 'schedule', to: '/admin/settings/shifts' },
  { id: 'working-weeks', label: 'Working Weeks', icon: 'date_range', to: '/admin/settings/working-weeks' },
  { id: 'holidays', label: 'Holidays', icon: 'celebration', to: '/admin/settings/holidays' },
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
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <nav
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-x-auto"
      aria-label="Settings sections"
    >
      <ul className="flex flex-row items-stretch min-w-max">
        {ADMIN_SETTINGS_NAV.map((item) => {
          const active = isActive(item.to)
          return (
            <li key={item.id} className="shrink-0">
              <Link
                to={item.to}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-body-sm border-b-2 transition-colors duration-200 whitespace-nowrap',
                  active
                    ? 'border-secondary text-secondary font-semibold bg-secondary/5'
                    : 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-background',
                )}
              >
                <span
                  className="material-symbols-outlined text-[20px] shrink-0"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
