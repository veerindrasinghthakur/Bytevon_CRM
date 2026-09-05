import { cn } from '@/shared/lib/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-11 h-11',
}

export function IconButton({
  label,
  children,
  size = 'md',
  className,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'text-on-surface-variant cursor-pointer',
        'transition-colors duration-200 ease-out',
        'hover:text-secondary hover:bg-surface-container',
        'active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
