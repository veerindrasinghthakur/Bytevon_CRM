import { Button } from '@/shared/components/ui/Button'
import type { AppNotification } from '../../types'

export function NotificationPreviewPanel({
  selected,
  onMarkRead,
  onArchive,
  onOpenRelated,
}: {
  selected: AppNotification | null
  onMarkRead: (id: string) => void
  onArchive: (id: string) => void
  onOpenRelated: (href: string) => void
}) {
  if (!selected) {
    return (
      <div className="flex-1 bv-surface flex flex-col self-stretch">
        <div className="flex-1 flex items-center justify-center text-on-surface-variant p-12">
          Select a notification
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bv-surface flex flex-col self-stretch">
      <div className="p-6 border-b border-outline-variant flex items-start justify-between gap-4 bg-surface-container-low">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary shrink-0">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {selected.icon}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-headline-md font-semibold text-on-background">{selected.title}</h2>
            <p className="text-label-md text-on-surface-variant mt-1">
              {selected.actor && (
                <span className="font-semibold text-on-background">{selected.actor}</span>
              )}
              {selected.employeeId && <> · {selected.employeeId}</>}
              {' · '}
              {selected.module}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6">
        {selected.meta?.map((m) => (
          <div
            key={m.label}
            className="flex items-center justify-between text-label-md border-b border-dashed border-outline-variant pb-2"
          >
            <span className="text-on-surface-variant font-semibold">{m.label}</span>
            <span className="text-on-background font-medium">{m.value}</span>
          </div>
        ))}
        <p className="text-body-md text-on-surface leading-relaxed">{selected.body}</p>
        {selected.note && (
          <div className="bg-surface-container-low p-5 rounded-xl border-l-4 border-secondary">
            <h5 className="text-label-md font-bold uppercase text-secondary mb-2 tracking-wider">Note</h5>
            <p className="text-body-md text-on-surface italic">&quot;{selected.note}&quot;</p>
          </div>
        )}
      </div>
      <div className="p-5 border-t border-outline-variant bg-surface-container-low flex flex-wrap items-center gap-3 mt-auto">
        <Button
          variant="primary"
          size="md"
          className="flex-1 min-w-[140px]"
          disabled={!selected.relatedHref}
          onClick={() => {
            if (selected.relatedHref) onOpenRelated(selected.relatedHref)
          }}
        >
          Open Related Record
        </Button>
        <Button variant="outline" size="md" onClick={() => onMarkRead(selected.id)}>
          Mark as Read
        </Button>
        <button
          type="button"
          className="p-3 bg-error-container text-on-error-container rounded-xl"
          onClick={() => onArchive(selected.id)}
          aria-label="Archive"
        >
          <span className="material-symbols-outlined">delete_outline</span>
        </button>
      </div>
    </div>
  )
}
