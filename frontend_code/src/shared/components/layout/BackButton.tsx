import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

interface BackButtonProps {
  /** Fallback when history cannot go back */
  to?: string
  /** Optional originating route (documentation); navigation prefers history */
  from?: string
  label?: string
  className?: string
}

/**
 * Shared back control — matches Role form interaction
 * (cursor, hover color, arrow slide on hover, focus ring).
 */
export function BackButton({ to, from: _from, label = 'Back', className }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    if (to) {
      navigate({ to })
      return
    }
    navigate({ to: '/dashboard' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 text-secondary cursor-pointer group',
        'hover:text-primary transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-1 py-0.5',
        'active:scale-[0.98]',
        className,
      )}
      aria-label={label}
    >
      <span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:-translate-x-1">
        arrow_back
      </span>
      <span className="text-label-md font-medium">{label}</span>
    </button>
  )
}
