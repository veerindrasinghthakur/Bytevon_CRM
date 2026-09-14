import { cn } from '@/shared/lib/cn'
import { projectStatusColors, FALLBACK_STATUS } from '../../cssTokens'
import type { ProjectStatus } from '../../enums'
import type { ProjectStatusBadgeProps } from '../../types'

/** Map backend ProjectStatus enum → frontend token keys. */
const STATUS_ALIAS: Record<string, ProjectStatus> = {
  PLANNING: 'PLANNING',
  PLANNED: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  ACTIVE: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ARCHIVED: 'CANCELLED',
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const key = STATUS_ALIAS[String(status ?? '').toUpperCase()] 
  const style = (key && projectStatusColors[key]) || {
    badge: FALLBACK_STATUS.className,
    label: status ? String(status).replace(/_/g, ' ') : FALLBACK_STATUS.label,
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium',
        style.badge,
        className,
      )}
    >
      {style.label}
    </span>
  )
}
