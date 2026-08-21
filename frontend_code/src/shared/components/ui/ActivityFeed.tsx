import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface ActivityItem {
  id: string
  title: string
  description?: string
  actor?: string
  timestamp: string
  icon?: string
  /** e.g. module or action badge */
  badge?: string
}

export interface ActivityFeedProps {
  items: ActivityItem[]
  emptyMessage?: string
  className?: string
  header?: ReactNode
}

/** Timeline-style activity list for audit / admin events. */
export function ActivityFeed({
  items,
  emptyMessage = 'No recent activity',
  className,
  header,
}: ActivityFeedProps) {
  return (
    <div className={cn('bv-surface overflow-hidden', className)}>
      {header ? (
        <div className="px-5 py-3 border-b border-outline-variant">{header}</div>
      ) : null}
      {items.length === 0 ? (
        <p className="p-6 text-body-sm text-on-surface-variant text-center">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-outline-variant">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 px-5 py-3">
              <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]" aria-hidden>
                  {item.icon ?? 'history'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-label-md font-semibold text-on-background">{item.title}</p>
                  <time className="text-label-sm text-on-surface-variant shrink-0">{item.timestamp}</time>
                </div>
                {item.description ? (
                  <p className="text-body-sm text-on-surface-variant mt-0.5">{item.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.actor ? (
                    <span className="text-label-sm text-on-surface-variant">{item.actor}</span>
                  ) : null}
                  {item.badge ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
