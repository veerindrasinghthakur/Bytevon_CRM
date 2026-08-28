import { cn } from '@/shared/lib/cn'
import type { ProjectStatus } from '../schemas/project'
import { projectStatusColors } from '../cssTokens'

interface ProjectStatusBadgeProps {
  status: ProjectStatus
  className?: string
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const style = projectStatusColors[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium',
        style.badge,
        className
      )}
    >
      {style.label}
    </span>
  )
}