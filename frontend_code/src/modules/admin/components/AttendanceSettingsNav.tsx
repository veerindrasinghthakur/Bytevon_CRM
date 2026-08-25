import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

export const ATTENDANCE_SETTINGS_NAV = [
  { id: 'general', label: 'Attendance Rules', icon: 'timer', to: '/admin/attendance-settings' },
] as const

export function AttendanceSettingsNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isActive = (to: string) => {
    if (to === '/admin/attendance-settings') {
      return (
        pathname === '/admin/attendance-settings' || pathname === '/admin/attendance-settings/'
      )
    }
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <nav
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-x-auto"
      aria-label="Attendance settings sections"
    >
      <ul className="flex flex-row items-stretch min-w-max">
        {ATTENDANCE_SETTINGS_NAV.map((item) => {
          const active = isActive(item.to)
          return (
            <li key={item.id} className="shrink-0">
              <Link
                to={item.to as never}
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
