import type { ProjectStatus } from '../schemas/project'
import { ProjectStatus as ProjectStatusValues } from '../enums'
import type { ProjectDetailTab } from '../types'
import { cn } from '@/shared/lib/cn'

export const PROJECT_DETAIL_TABS: { id: ProjectDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
]

export const STATUS_TIMELINE: ProjectStatus[] = [...ProjectStatusValues]

export function formatProjectDate(value?: string | null): string {
  if (!value) return '—'
  const raw = String(value).slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  try {
    return new Date(value).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) {
  return (
    <div className="bv-surface p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-lg">{icon}</span>
        <span className="text-label-sm">{label}</span>
      </div>
      <p className="text-title-lg font-bold text-on-background">{value}</p>
    </div>
  )
}

export function StatusTimelineCard({ status }: { status: ProjectStatus }) {
  return (
    <section className="bv-surface p-5">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-4">
        Status timeline
      </h4>
      <ol className="relative border-l-2 border-outline-variant ml-2 space-y-5">
        {STATUS_TIMELINE.map((s) => {
          const reached =
            STATUS_TIMELINE.indexOf(s) <= STATUS_TIMELINE.indexOf(status) && status !== 'CANCELLED'
          const active = status === s
          return (
            <li key={s} className="ml-5 relative">
              <span
                className={cn(
                  'absolute -left-[1.65rem] top-0 w-6 h-6 rounded-full flex items-center justify-center',
                  active
                    ? 'bg-secondary text-on-primary'
                    : reached
                      ? 'bg-secondary/20 text-secondary'
                      : 'bg-surface-container text-on-surface-variant',
                )}
              >
                <span className="material-symbols-outlined text-xs">
                  {s === 'COMPLETED' ? 'check' : s === 'CANCELLED' ? 'close' : 'circle'}
                </span>
              </span>
              <p className={cn('text-sm font-semibold', active && 'text-secondary')}>
                {s.replace(/_/g, ' ')}
              </p>
              {active && (
                <p className="text-[11px] text-on-surface-variant mt-0.5">Current status</p>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
