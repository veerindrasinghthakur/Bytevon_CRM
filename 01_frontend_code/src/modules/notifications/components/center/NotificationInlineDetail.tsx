import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { useNotificationDetail } from '../../hooks/center/use-notifications'
import type { AppNotification } from '../../types'

/**
 * Full notification detail rendered inline in the center page's right
 * section when an entry is clicked (replaces the summary preview panel).
 */
export function NotificationInlineDetail({
  notificationId,
  fallback,
  onMarkRead,
  onArchive,
  onDelete,
  markReadPending,
  onOpenRelated,
}: {
  notificationId: string | null
  fallback: AppNotification | null
  onMarkRead: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  markReadPending: boolean
  onOpenRelated: (href: string) => void
}) {
  const { data: full, isLoading } = useNotificationDetail(notificationId ?? undefined)
  const n = full ?? fallback

  if (!notificationId || !n) {
    return (
      <div className="flex-1 bv-surface flex flex-col self-stretch">
        <div className="flex-1 flex items-center justify-center text-on-surface-variant p-12">
          Select a notification to view its details
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bv-surface flex flex-col self-stretch overflow-hidden">
      <div className="p-6 border-b border-outline-variant bg-surface-container-low">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary shrink-0">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {n.icon}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-headline-md font-semibold text-on-background">{n.title}</h2>
              {(n.priority === 'Critical' || n.priority === 'High') && (
                <span className="bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full text-label-sm uppercase font-semibold">
                  {n.priority}
                </span>
              )}
            </div>
            <p className="text-label-md text-on-surface-variant mt-1">
              {n.actor && <span className="font-semibold text-on-background">{n.actor}</span>}
              {n.employeeId && <> · {n.employeeId}</>}
              {' · '}
              {n.module} · {n.timeAgo}
            </p>
            <p className="text-label-sm text-on-surface-variant mt-1">
              Status: <span className="font-semibold text-on-background">{n.status}</span>
              {' · Priority: '}
              <span className="font-semibold text-on-background">{n.priority}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {isLoading && (
          <p className="text-body-sm text-on-surface-variant">Loading full details…</p>
        )}
        <div
          className={cn(
            'p-4 rounded-lg border-l-4',
            n.priority === 'Critical' || n.priority === 'High'
              ? 'bg-surface-container-low border-error'
              : 'bg-surface-container-low border-secondary',
          )}
        >
          <p className="text-body-md text-on-surface leading-relaxed">{n.body}</p>
          {n.note && <p className="text-body-md text-on-surface mt-3 leading-relaxed">{n.note}</p>}
        </div>

        {n.meta && n.meta.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {n.meta.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between text-label-md border-b border-dashed border-outline-variant pb-2"
              >
                <span className="text-on-surface-variant font-semibold">{m.label}</span>
                <span className="text-on-background font-medium">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        {n.timeline && n.timeline.length > 0 && (
          <div className="space-y-4">
            <h5 className="text-label-md font-bold uppercase text-on-surface-variant tracking-widest">
              Activity Timeline
            </h5>
            <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant">
              {n.timeline.map((t) => (
                <div key={t.title} className="relative">
                  <div
                    className={cn(
                      'absolute -left-8 top-1 w-6 h-6 rounded-full bg-surface-container-lowest border-4 z-10',
                      t.active ? 'border-secondary' : 'border-outline-variant',
                    )}
                  />
                  <p className="text-body-md font-bold text-on-background">{t.title}</p>
                  <p className="text-label-sm text-on-surface-variant">{t.time}</p>
                  <p className="text-body-sm mt-1 text-on-surface-variant">{t.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <span className="bg-surface-container px-2.5 py-1 rounded-full text-label-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">notifications</span> In-App
          </span>
          <span className="bg-surface-container px-2.5 py-1 rounded-full text-label-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">mail</span> Email
          </span>
        </div>
      </div>

      <div className="p-5 border-t border-outline-variant bg-surface-container-low flex flex-wrap items-center gap-3 mt-auto">
        <Can action={Action.UPDATE} resource="notification">
          <Button
            variant="primary"
            size="md"
            className="flex-1 min-w-[140px]"
            disabled={markReadPending}
            onClick={() => onMarkRead(n.id)}
          >
            {markReadPending ? 'Marking…' : n.status === 'Unread' ? 'Mark as Read' : 'Marked Read'}
          </Button>
        </Can>
        <Button
          variant="outline"
          size="md"
          disabled={!n.relatedHref}
          onClick={() => {
            if (n.relatedHref) onOpenRelated(n.relatedHref)
          }}
        >
          Open Related
        </Button>
        <Can action={Action.UPDATE} resource="notification">
          <button
            type="button"
            className="p-3 bg-surface-container-high text-on-surface-variant rounded-xl hover:bg-surface-container-highest transition-colors"
            onClick={() => onArchive(n.id)}
            aria-label="Archive"
            title="Archive"
          >
            <span className="material-symbols-outlined">archive</span>
          </button>
          <button
            type="button"
            className="p-3 bg-error-container text-on-error-container rounded-xl"
            onClick={() => onDelete(n.id)}
            aria-label="Delete"
            title="Delete"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </Can>
      </div>
    </div>
  )
}
