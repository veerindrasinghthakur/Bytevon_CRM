import { cn } from '@/shared/lib/cn'
import type { TaskStatus, TaskPriority } from '../api/tasks'

const STATUS: Record<string, { label: string; className: string }> = {
  TODO: { label: 'To Do', className: 'bg-surface-container-high text-on-surface-variant' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-electric-blue/10 text-electric-blue' },
  IN_REVIEW: { label: 'In Review', className: 'bg-violet-100 text-violet-800' },
  DONE: { label: 'Done', className: 'bg-emerald-100 text-emerald-800' },
  BLOCKED: { label: 'Blocked', className: 'bg-error/10 text-error' },
  ON_HOLD: { label: 'On Hold', className: 'bg-amber-100 text-amber-800' },
}

const PRIORITY: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'text-on-surface-variant' },
  MEDIUM: { label: 'Medium', className: 'text-on-surface' },
  HIGH: { label: 'High', className: 'text-amber-700' },
  URGENT: { label: 'Urgent', className: 'text-error font-semibold' },
}

const FALLBACK_STATUS = { label: 'Unknown', className: 'bg-surface-container text-on-surface-variant' }
const FALLBACK_PRIORITY = { label: '—', className: 'text-on-surface-variant' }

export function TaskStatusBadge({ status }: { status?: TaskStatus | string | null }) {
  const s = (status && STATUS[status]) || FALLBACK_STATUS
  return (
    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-medium', s.className)}>
      {s.label}
    </span>
  )
}

export function TaskPriorityLabel({ priority }: { priority?: TaskPriority | string | null }) {
  const p = (priority && PRIORITY[priority]) || FALLBACK_PRIORITY
  return <span className={cn('text-body-sm', p.className)}>{p.label}</span>
}
