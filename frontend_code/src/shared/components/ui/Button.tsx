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

/** HTML screens: hover:opacity-90 active:scale-95 + executive-shadow on solid CTAs */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-electric-blue text-white hover:bg-[#0062cc] executive-shadow hover:opacity-90 active:scale-95',
  secondary:
    'bg-secondary text-white hover:bg-[#004a9e] executive-shadow hover:opacity-90 active:scale-95',
  outline:
    'border border-outline-variant bg-surface-container-lowest text-on-background hover:bg-surface-container active:scale-95',
  ghost:
    'text-on-surface-variant hover:bg-surface-container hover:text-on-background',
  danger:
    'bg-error text-white hover:opacity-90 active:scale-95',
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
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium cursor-pointer',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
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
