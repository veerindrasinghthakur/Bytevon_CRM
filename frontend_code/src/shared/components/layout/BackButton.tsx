import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

interface BackButtonProps {
  /**
   * Fallback path only when there is no usable history entry
   * (e.g. user opened the page in a new tab). Prefer leaving this
   * unset so Back always returns to the route the user came from.
   */
  to?: string
  /**
   * Optional originating route for documentation / analytics.
   * Navigation still prefers history.back(); `to` is the fallback.
   */
  from?: string
  label?: string
  className?: string
}

/**
 * Shared back control for create/detail/edit pages.
 * Always prefers browser history so the user returns to the page they came from.
 * `to` is only used when history cannot go back.
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
        'inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant',
        'hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-1 py-0.5',
        className,
      )}
      aria-label={label}
    >
      <span className="material-symbols-outlined text-[20px]">arrow_back</span>
      <span>{label}</span>
    </button>
  )
}
