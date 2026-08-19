import { cn } from '@/shared/lib/cn'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Enable lift + stronger shadow on hover (HTML executive card pattern) */
  hover?: boolean
  /** Extra padding; default p-6 */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

/**
 * Shared surface card — matches HTML:
 * bg-surface-container-lowest + border + executive-shadow (+ optional card-hover)
 */
export function Card({ children, hover = false, padding = 'lg', className, ...props }: CardProps) {
  return (
    <div
      className={cn('bv-surface', hover && 'card-hover', paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
}
