import { cn } from '@/shared/lib/cn'
import type { TaskStatus, TaskPriority } from '../../api/task'
import { taskStatusColors, taskPriorityColors, FALLBACK_STATUS, FALLBACK_PRIORITY } from '../../cssTokens'

export function TaskStatusBadge({ status }: { status?: TaskStatus | string | null }) {
  const s = (status && taskStatusColors[status as TaskStatus]) || FALLBACK_STATUS
  return (
    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-medium', s.className)}>
      {s.label}
    </span>
  )
}

export function TaskPriorityLabel({ priority }: { priority?: TaskPriority | string | null }) {
  const p = (priority && taskPriorityColors[priority as TaskPriority]) || FALLBACK_PRIORITY
  return <span className={cn('text-body-sm', p.className)}>{p.label}</span>
}
