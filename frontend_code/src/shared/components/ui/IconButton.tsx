import { cn } from '@/shared/lib/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  label: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
}

export function IconButton({
  children,
  label,
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
        'transition-colors active:opacity-80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue',
        sizeMap[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}