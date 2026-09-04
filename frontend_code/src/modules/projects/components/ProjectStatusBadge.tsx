import { cn } from '@/shared/lib/cn'
import { projectStatusColors } from '../cssTokens'
import {ProjectStatusBadgeProps} from '../types'

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