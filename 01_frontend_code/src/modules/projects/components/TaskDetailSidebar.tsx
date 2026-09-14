import { Link } from '@tanstack/react-router'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { projectRoutes } from '../routes'
import type { Task } from '../types'

function formatDisplayDate(value?: string | null): string {
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
    return new Date(value).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-background text-right">{value}</span>
    </div>
  )
}

type Props = {
  task: Task
}

export function TaskDetailSidebar({ task }: Props) {
  const initials = (task.assigneeName ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="space-y-4">
      <section className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low/50">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">info</span>
            Task Details
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
              Assignee
            </label>
            <div
              className={cn(
                'flex items-center justify-between p-2 rounded-lg border border-outline-variant',
                'bg-surface-container-low/50',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    {task.assigneeName ?? 'Unassigned'}
                  </p>
                  {task.assigneeEmploymentId != null && (
                    <p className="text-caption text-on-surface-variant">
                      Employment #{task.assigneeEmploymentId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <MetaRow label="Project" value={task.projectName ?? '—'} />
          <MetaRow label="Priority" value={task.priority} />
          <MetaRow label="Status" value={task.status.replace(/_/g, ' ')} />
          <MetaRow label="Due" value={formatDisplayDate(task.dueDate)} />
          <MetaRow label="Created" value={formatDisplayDate(task.createdAt)} />
          {task.projectId ? (
            <Link
              {...looseLinkProps({
                to: projectRoutes.projectDetailPath,
                params: { projectId: String(task.projectId) },
                className: 'block text-sm font-semibold text-secondary hover:underline',
              })}
            >
              Open project →
            </Link>
          ) : null}
        </div>
      </section>
    </aside>
  )
}
