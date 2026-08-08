import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import { BackButton } from './BackButton'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: ReactNode
  actions?: ReactNode
  /** Show back control above title (create/detail pages) */
  showBack?: boolean
  backTo?: string
  backLabel?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  showBack = false,
  backTo,
  backLabel = 'Back',
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-section-gap flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {showBack && (
          <div className="mb-2">
            <BackButton to={backTo} label={backLabel} />
          </div>
        )}
        {breadcrumbs && <div className="mb-1">{breadcrumbs}</div>}
        <h1 className="text-headline-lg text-on-background">{title}</h1>
        {description && (
          <p className="text-body-md text-on-surface-variant mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
