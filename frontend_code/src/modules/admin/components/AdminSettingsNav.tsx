import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

export const ADMIN_SETTINGS_NAV = [
  { id: 'organization', label: 'Organization Profile', icon: 'corporate_fare', to: '/admin/settings' },
  { id: 'head-office', label: 'Head Office', icon: 'location_city', to: '/admin/settings/head-office' },
  { id: 'locations', label: 'Office Locations', icon: 'apartment', to: '/admin/settings/locations' },
  { id: 'shifts', label: 'Shifts', icon: 'schedule', to: '/admin/settings/shifts' },
  { id: 'working-weeks', label: 'Working Weeks', icon: 'date_range', to: '/admin/settings/working-weeks' },
  { id: 'holidays', label: 'Holiday Calendars', icon: 'celebration', to: '/admin/settings/holidays' },
  { id: 'positions', label: 'Positions', icon: 'work', to: '/admin/settings/positions' },
  { id: 'branding', label: 'Branding', icon: 'palette', to: '/admin/settings/branding' },
  { id: 'regional', label: 'Regional Config', icon: 'language', to: '/admin/settings/regional' },
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
      className="w-full md:w-56 shrink-0 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden"
      aria-label="Settings sections"
    >
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <p className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Settings</p>
      </div>
      <ul className="py-2">
        {ADMIN_SETTINGS_NAV.map((item) => {
          const active = isActive(item.to)
          return (
            <li key={item.id}>
              <Link
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-body-sm border-l-4 transition-colors duration-200',
                  active
                    ? 'border-secondary bg-secondary/10 text-secondary font-semibold'
                    : 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-background',
                )}
              >
                <span
                  className="material-symbols-outlined text-[20px] shrink-0"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
