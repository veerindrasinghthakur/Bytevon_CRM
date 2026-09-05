import { cn } from '@/shared/lib/cn'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

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
