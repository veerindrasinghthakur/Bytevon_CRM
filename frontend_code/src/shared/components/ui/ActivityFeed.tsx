import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface ActivityItem {
  id: string
  title: string
  description?: string
  actor?: string
  timestamp: string
  icon?: string
  /** Module / type badge e.g. ROLES, AUTH */
  badge?: string
}

export interface ActivityFeedProps {
  items: ActivityItem[]
  /** standard = detail pages; compact = sidebars / overview cards */
  variant?: 'standard' | 'compact'
  emptyMessage?: string
  emptyHint?: string
  className?: string
  /** Card header title (default: Recent Activity / Quick Log) */
  title?: string
  /** Optional action on the right of the header (e.g. View All button) */
  headerAction?: ReactNode
  /** When false, omit outer card chrome (for embedding inside an existing card) */
  framed?: boolean
  /** @deprecated use title + headerAction */
  header?: ReactNode
}

/**
 * Activity timeline — matches Bytevon Component Library: Timeline.
 * Vertical connector + circular icon nodes. Tokens only (light/dark safe).
 * Variants: standard (detail), compact (sidebar/overview), empty state built-in.
 */
export function ActivityFeed({
  items,
  variant = 'standard',
  emptyMessage = 'No recent activity',
  emptyHint = 'Actions taken in this module will appear here.',
  className,
  title,
  headerAction,
  framed = true,
  header,
}: ActivityFeedProps) {
  const isCompact = variant === 'compact'
  const resolvedTitle = title ?? (isCompact ? 'Quick Log' : 'Recent Activity')

  return (
    <div
      className={cn(
        framed &&
          'bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm',
        framed && (isCompact ? 'p-5' : 'p-6'),
        className,
      )}
    >
      {header ? (
        <div className="mb-4">{header}</div>
      ) : (
        <div className={cn('flex items-center justify-between', isCompact ? 'mb-4' : 'mb-6')}>
          <h4 className="text-label-md font-semibold text-on-surface">{resolvedTitle}</h4>
          {headerAction}
        </div>
      )}

      {items.length === 0 ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center text-center',
            isCompact ? 'min-h-[120px] py-6' : 'min-h-[200px] py-8',
          )}
        >
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-outline text-[24px]" aria-hidden>
              history_toggle_off
            </span>
          </div>
          <p className="text-label-md font-medium text-on-surface mb-1">{emptyMessage}</p>
          {emptyHint ? (
            <p className="text-body-sm text-on-surface-variant max-w-[200px]">{emptyHint}</p>
          ) : null}
        </div>
      ) : isCompact ? (
        <CompactList items={items} />
      ) : (
        <StandardList items={items} />
      )}
    </div>
  )
}

function StandardList({ items }: { items: ActivityItem[] }) {
  return (
    <div className="relative pl-3">
      <div
        className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-outline-variant/40 rounded-full"
        aria-hidden
      />
      <ul className="space-y-6">
        {items.map((item) => (
          <li key={item.id} className="relative flex gap-4 items-start">
            <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0 z-10 border-[3px] border-surface-container-lowest shadow-sm">
              <span
                className="material-symbols-outlined text-on-secondary-container text-[18px]"
                aria-hidden
              >
                {item.icon ?? 'history'}
              </span>
            </div>
            <div className="flex-1 pt-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-body-sm font-semibold text-on-surface">{item.title}</span>
                  {item.badge ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-tertiary-container/10 text-on-tertiary-container">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <time className="text-label-sm text-on-surface-variant/70 whitespace-nowrap shrink-0">
                  {item.timestamp}
                </time>
              </div>
              {item.description ? (
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  {item.description}
                </p>
              ) : null}
              {item.actor ? (
                <p className="text-label-sm text-on-surface-variant mt-0.5">{item.actor}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CompactList({ items }: { items: ActivityItem[] }) {
  return (
    <div className="relative pl-2">
      <div
        className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-outline-variant/30 rounded-full"
        aria-hidden
      />
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="relative flex gap-3 items-center">
            <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center shrink-0 z-10 border-2 border-surface-container-lowest shadow-sm">
              <span
                className="material-symbols-outlined text-on-secondary-container text-[14px]"
                aria-hidden
              >
                {item.icon ?? 'history'}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-label-sm font-semibold text-on-surface truncate">
                  {item.title}
                </span>
                {item.badge ? (
                  <span className="inline-flex items-center px-1 py-0 rounded text-[9px] font-bold uppercase tracking-wider bg-tertiary-container/10 text-on-tertiary-container shrink-0">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <time className="text-[10px] font-medium text-on-surface-variant/70 shrink-0">
                {item.timestamp}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Alias matching design-system naming */
export const ActivityTimeline = ActivityFeed
