import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { BackButtonProps } from '@/shared/types'

export function BackButton({ to, from: _from, label = 'Back', className }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    if (to) {
      // Routes use validateSearch: () => ({}) — search is required by typed navigate
      void navigate({ to, search: {} } as never)
      return
    }
    void navigate({ to: '/dashboard', search: {} } as never)
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
