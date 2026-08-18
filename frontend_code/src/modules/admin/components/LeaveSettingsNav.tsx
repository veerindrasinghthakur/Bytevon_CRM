import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

export const LEAVE_SETTINGS_NAV = [
  { id: 'general', label: 'Types & Rules', icon: 'event_busy', to: '/admin/leave-settings' },
  { id: 'policies', label: 'Policies', icon: 'policy', to: '/admin/leave-settings/policies' },
] as const

export function LeaveSettingsNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isActive = (to: string) => {
    if (to === '/admin/leave-settings') {
      return pathname === '/admin/leave-settings' || pathname === '/admin/leave-settings/'
    }
    if (to === '/admin/leave-settings/policies') {
      return pathname.startsWith('/admin/leave-settings/policies')
    }
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <nav
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm scrollbar-hide"
      aria-label="Leave settings sections"
    >
      <ul className="flex flex-row items-stretch">
        {LEAVE_SETTINGS_NAV.map((item) => {
          const active = isActive(item.to)
          return (
            <li key={item.id} className="flex-1">
              <Link
                to={item.to}
                title={item.label}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2.5 text-[11px] border-b-2 transition-colors duration-200',
                  active
                    ? 'border-secondary text-secondary font-semibold bg-secondary/5'
                    : 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-background',
                )}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="hidden sm:block">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
