import { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { HeaderBreakChip } from './HeaderBreakChip'
import { HeaderAttendanceSummary } from './HeaderAttendanceSummary'
import { HeaderProps } from '@/shared/types'
import { notificationRoutes, useNotificationBell } from '@/modules/notifications'
import { profileRoutes } from '@/modules/my-work/routes'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'

export const HEADER_HEIGHT_PX = 56

export function Header({ title, className, style }: HeaderProps) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const bell = useNotificationBell()
  const [bellOpen, setBellOpen] = useState(false)
  const isProfileActive = pathname === '/profile' || pathname.startsWith('/profile/')
  const isNotificationsActive =
    pathname === '/notifications' || pathname.startsWith('/notifications/')
  const isBreakActive = pathname === '/my-work/break'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-40 h-14 bg-surface border-b border-outline-variant',
        'flex items-center justify-between px-margin-desktop',
        className,
      )}
      style={style}
      data-shell-header="v2"
    >
      <div className="flex items-center gap-4 min-w-0">
        {title && (
          <h2 className="text-body-md font-semibold text-on-background truncate hidden md:block">
            {title}
          </h2>
        )}
      </div>

      <div className="flex-1 flex justify-center max-w-md mx-4">
        <div className="flex items-center w-full max-w-xs bg-surface-container-low rounded-lg px-3 py-1.5 border border-outline-variant focus-within:border-electric-blue">
          <span
            className="material-symbols-outlined text-on-surface-variant mr-2 text-lg"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="search"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant"
            aria-label="Global search"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <HeaderBreakChip active={isBreakActive} />
        <HeaderAttendanceSummary />

        <div className="relative">
          <button
            type="button"
            aria-label={`My notifications${bell.unread > 0 ? `, ${bell.unread} unread` : ''}`}
            title="Notifications"
            onClick={() => setBellOpen((o) => !o)}
            className={cn(
              'relative inline-flex items-center justify-center rounded-full p-2',
              'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue',
              (isNotificationsActive || bellOpen) && 'bg-[#e8f1ff] text-secondary',
            )}
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={
                isNotificationsActive ? { fontVariationSettings: "'FILL' 1" } : undefined
              }
            >
              notifications
            </span>
            {bell.unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-surface">
                {bell.unread > 99 ? '99+' : bell.unread}
              </span>
            )}
          </button>
          {bellOpen && (
            <>
              <button
                type="button"
                aria-label="Close notifications"
                className="fixed inset-0 z-40 cursor-default bg-transparent"
                onClick={() => setBellOpen(false)}
              />
              <div className="absolute right-0 top-11 z-50 w-80 bv-surface executive-shadow rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                  <p className="text-label-md font-semibold text-on-background">
                    Notifications{bell.unread > 0 ? ` (${bell.unread} unread)` : ''}
                  </p>
                  <button
                    type="button"
                    className="text-label-md text-secondary hover:underline"
                    onClick={() => {
                      setBellOpen(false)
                      safeNavigate(navigate, { to: notificationRoutes.center })
                    }}
                  >
                    View all
                  </button>
                </div>
                {bell.latest.length === 0 ? (
                  <p className="px-4 py-6 text-body-sm text-on-surface-variant text-center">
                    {bell.isLoading ? 'Loading…' : 'No unread notifications.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-outline-variant/40 max-h-80 overflow-y-auto">
                    {bell.latest.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-surface-container-low transition-colors"
                          onClick={() => {
                            setBellOpen(false)
                            safeNavigate(navigate, {
                              to: notificationRoutes.detailPath,
                              params: { notificationId: n.id },
                            })
                          }}
                        >
                          <p className="text-body-sm font-semibold text-on-background line-clamp-1">
                            {n.title}
                          </p>
                          <p className="text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
                            {n.body}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        <Link
          {...looseLinkProps({
            to: profileRoutes.root,
            className: cn(
              'flex items-center gap-2.5 pl-3 ml-1 py-1 pr-1.5 rounded-md',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue',
              isProfileActive
                ? 'border-l-4 border-deep-navy bg-surface-container'
                : 'border-l border-outline-variant/50',
            ),
            'aria-label': 'Open profile',
            'aria-current': isProfileActive ? 'page' : undefined,
            'data-active': isProfileActive ? 'true' : 'false',
          })}
          aria-current={isProfileActive ? 'page' : undefined}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
              isProfileActive
                ? 'bg-deep-navy text-white'
                : 'bg-surface-container-highest text-on-surface',
            )}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              person
            </span>
          </div>
          <span
            className={cn(
              'text-label-md font-semibold hidden sm:inline',
              isProfileActive ? 'text-deep-navy' : 'text-on-surface',
            )}
          >
            Profile
          </span>
        </Link>
      </div>
    </header>
  )
}
