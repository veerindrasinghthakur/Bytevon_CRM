import { cn } from '@/shared/lib/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

/**
 * Primary CTA matches Stitch (electric / brand blue — not deep navy).
 * Deep navy remains for rail / chrome only.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-electric-blue text-white hover:bg-secondary shadow-sm',
  secondary:
    'bg-secondary text-on-secondary hover:opacity-90',
  outline:
    'border border-outline-variant bg-surface-container-lowest text-on-background hover:bg-surface-container',
  ghost:
    'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  danger:
    'bg-error text-on-error hover:opacity-90',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-label-sm',
  md: 'px-4 py-2.5 text-label-md',
  lg: 'px-6 py-3 text-body-md',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}
