import { cn } from '@/shared/lib/cn'
import type { ProjectStatus } from '../schemas/project'

const STATUS_STYLES: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  PLANNING: {
    label: 'Planning',
    className: 'bg-surface-container-high text-on-surface-variant',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-electric-blue/10 text-electric-blue',
  },
  ON_HOLD: {
    label: 'On Hold',
    className: 'bg-amber-100 text-amber-800',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-error/10 text-error',
  },
}

interface ProjectStatusBadgeProps {
  status: ProjectStatus
  className?: string
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const style = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium',
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  )
}