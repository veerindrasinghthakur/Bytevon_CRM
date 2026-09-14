import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { looseLinkProps } from '@/shared/lib/safeNavigate'

const items = [
  { label: 'Leave Types', to: '/admin/leave-settings' },
  { label: 'Policies', to: '/admin/leave-settings/policies' },
] as const

export function LeaveSettingsNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav
      aria-label="Leave settings"
      className="flex gap-1 overflow-x-auto border-b border-outline-variant"
    >
      {items.map((item) => {
        const isActive =
          item.to === '/admin/leave-settings'
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + '/')

        return (
          <Link
            key={item.to}
            {...looseLinkProps({
              to: item.to,
              className: cn(
                'whitespace-nowrap px-4 py-3 text-label-md transition-colors',
                isActive
                  ? 'border-b-2 border-secondary text-secondary font-semibold'
                  : 'text-on-surface-variant hover:text-on-background',
              ),
            })}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
