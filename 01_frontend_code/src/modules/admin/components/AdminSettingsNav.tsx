import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { looseLinkProps } from '@/shared/lib/safeNavigate'

const items = [
  { label: 'Organization', to: '/admin/settings' },
  { label: 'Head Office', to: '/admin/settings/head-office' },
  { label: 'Branding', to: '/admin/settings/branding' },
  { label: 'Regional', to: '/admin/settings/regional' },
  { label: 'Locations', to: '/admin/settings/locations' },
  { label: 'Shifts', to: '/admin/settings/shifts' },
  { label: 'Working Weeks', to: '/admin/settings/working-weeks' },
  { label: 'Holidays', to: '/admin/settings/holidays' },
  { label: 'Positions', to: '/admin/settings/positions' },
] as const

export function AdminSettingsNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav
      aria-label="Administration settings"
      className="flex gap-1 overflow-x-auto border-b border-outline-variant"
    >
      {items.map((item) => (
        <Link
          key={item.to}
          {...looseLinkProps({
            to: item.to,
            className: cn(
              'whitespace-nowrap px-4 py-3 text-label-md transition-colors',
              (item.to === '/admin/settings'
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(item.to + '/'))
                ? 'border-b-2 border-secondary text-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-background',
            ),
          })}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
