import { cn } from '@/shared/lib/cn'
import type { AppNotification } from '../../types'

export function NotificationCard({
  n,
  active,
  selected,
  selectionMode,
  onSelect,
  onPressStart,
  onPressEnd,
  onPressCancel,
  onDelete,
}: {
  n: AppNotification
  active: boolean
  selected: boolean
  selectionMode: boolean
  onSelect: () => void
  onPressStart: () => void
  onPressEnd: () => void
  onPressCancel: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'text-left rounded-xl p-5 border transition-all relative select-none',
        active
          ? 'bg-surface-container-high border-2 border-secondary executive-shadow'
          : 'bv-surface hover:border-secondary/50',
        selected && 'ring-2 ring-secondary/40',
        n.status === 'Read' && !active && 'opacity-80',
      )}
      onMouseDown={onPressStart}
      onMouseUp={onPressEnd}
      onMouseLeave={onPressCancel}
      onTouchStart={onPressStart}
      onTouchEnd={onPressEnd}
      onTouchCancel={onPressCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r" />}
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            className="rounded border-outline-variant text-secondary"
            checked={selected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <div className={cn('flex items-start gap-4', selectionMode && 'pl-6')}>
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
              active
                ? 'bg-secondary-container text-on-secondary'
                : 'bg-surface-container-highest text-on-background',
            )}
          >
            <span className="material-symbols-outlined text-2xl">{n.icon}</span>
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-[10px] font-black uppercase text-secondary tracking-widest truncate">
                {n.module}
              </span>
              <span className="text-[11px] text-on-surface-variant shrink-0">{n.timeAgo}</span>
            </div>
            <h4 className="text-title-lg font-semibold text-on-background line-clamp-1">{n.title}</h4>
            <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-1">{n.body}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className={cn(
                  'px-2 py-0.5 text-[10px] font-bold rounded uppercase',
                  n.priority === 'Critical' || n.priority === 'High'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-surface-container text-on-surface-variant',
                )}
              >
                {n.priority === 'Critical' ? 'Urgent' : n.priority}
              </span>
            </div>
          </div>
        </div>
      </button>
      <div className="absolute top-3 right-3">
        <button
          type="button"
          className="p-1 rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
          aria-label="Delete notification"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <span className="material-symbols-outlined text-[20px]">delete_outline</span>
        </button>
      </div>
    </div>
  )
}
