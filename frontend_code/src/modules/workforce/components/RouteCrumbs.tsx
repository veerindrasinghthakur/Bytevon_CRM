import { Link } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

export type Crumb = { label: string; to?: string }

export function RouteCrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1 text-label-sm text-on-surface-variant', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && (
              <span className="material-symbols-outlined text-base text-on-surface-variant/70" aria-hidden>
                chevron_right
              </span>
            )}
            {item.to && !last ? (
              <Link to={item.to} className="hover:text-secondary hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={cn(last && 'font-medium text-on-background')}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
