import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

interface BackButtonProps {
  /** Explicit path; if omitted, uses browser history back */
  to?: string
  label?: string
  className?: string
}

/**
 * Standard back control for create/detail/edit pages.
 * Prefer `to` for predictable list return; falls back to history.back().
 */
export function BackButton({ to, label = 'Back', className }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate({ to })
    } else if (window.history.length > 1) {
      window.history.back()
    } else {
      navigate({ to: '/dashboard' })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant',
        'hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue rounded-md px-1 py-0.5',
        className
      )}
      aria-label={label}
    >
      <span className="material-symbols-outlined text-[20px]">arrow_back</span>
      <span>{label}</span>
    </button>
  )
}
