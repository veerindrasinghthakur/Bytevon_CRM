import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">{icon}</span>
      </div>
      <h3 className="text-title-lg text-on-background mb-2">{title}</h3>
      {description && (
        <p className="text-body-md text-on-surface-variant max-w-md mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  )
}