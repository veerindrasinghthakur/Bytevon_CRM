import { cn } from '@/shared/lib/cn'
import type { TaskStatus, TaskPriority } from '../api/tasks'

const STATUS: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: 'To Do', className: 'bg-surface-container-high text-on-surface-variant' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-electric-blue/10 text-electric-blue' },
  IN_REVIEW: { label: 'In Review', className: 'bg-violet-100 text-violet-800' },
  DONE: { label: 'Done', className: 'bg-emerald-100 text-emerald-800' },
  BLOCKED: { label: 'Blocked', className: 'bg-error/10 text-error' },
}

const PRIORITY: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'text-on-surface-variant' },
  MEDIUM: { label: 'Medium', className: 'text-on-surface' },
  HIGH: { label: 'High', className: 'text-amber-700' },
  URGENT: { label: 'Urgent', className: 'text-error font-semibold' },
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS[status]
  return (
    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-medium', s.className)}>
      {s.label}
    </span>
  )
}

export function TaskPriorityLabel({ priority }: { priority: TaskPriority }) {
  const p = PRIORITY[priority]
  return <span className={cn('text-body-sm', p.className)}>{p.label}</span>
}
