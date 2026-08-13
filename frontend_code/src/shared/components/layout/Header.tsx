import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

/** Shared shell header height — keep SecondarySidebar top row the same */
export const HEADER_HEIGHT_PX = 56

interface HeaderProps {
  title?: string
  className?: string
  style?: React.CSSProperties
}

export function Header({ title, className, style }: HeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isProfileActive = pathname === '/profile' || pathname.startsWith('/profile/')
  const isNotificationsActive =
    pathname === '/notifications' || pathname.startsWith('/notifications/')

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-40 h-14 bg-surface border-b border-outline-variant',
        'flex items-center justify-between px-margin-desktop',
        className
      )}
      style={style}
    >
      <div className="flex items-center gap-4 min-w-0">
        {title && (
          <h2 className="text-body-md font-semibold text-on-background truncate hidden md:block">{title}</h2>
        )}
      </div>

      <div className="flex-1 flex justify-center max-w-md mx-4">
        <div className="flex items-center w-full max-w-xs bg-surface-container-low rounded-lg px-3 py-1.5 border border-outline-variant focus-within:border-electric-blue">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
          <input
            type="search"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant"
            aria-label="Global search"
          />
        </div>
      </div>

      <div className="flex items-center gap-gutter shrink-0">
        <Link
          to="/notifications"
          aria-label="My notifications"
          title="Notifications"
          className={cn(
            'inline-flex items-center justify-center rounded-full p-2',
            'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue',
            isNotificationsActive && 'bg-surface-container text-secondary'
          )}
        >
          <span
            className="material-symbols-outlined"
            style={
              isNotificationsActive ? { fontVariationSettings: "'FILL' 1" } : undefined
            }
          >
            notifications
          </span>
        </Link>

        {/* Left divider turns deep navy when Profile is active */}
        <Link
          to="/profile"
          className={cn(
            'flex items-center gap-3 border-l-2 pl-gutter ml-1 rounded-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue',
            isProfileActive
              ? 'border-deep-navy bg-surface-container/60'
              : 'border-outline-variant'
          )}
          aria-label="Open profile"
          aria-current={isProfileActive ? 'page' : undefined}
        >
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center',
              isProfileActive
                ? 'bg-deep-navy text-white'
                : 'bg-surface-container-highest text-on-surface'
            )}
          >
            <span className="material-symbols-outlined text-base">person</span>
          </div>
          <span
            className={cn(
              'text-label-md font-semibold hidden sm:inline',
              isProfileActive ? 'text-deep-navy' : 'text-on-surface'
            )}
          >
            Profile
          </span>
        </Link>
      </div>
    </header>
  )
}
