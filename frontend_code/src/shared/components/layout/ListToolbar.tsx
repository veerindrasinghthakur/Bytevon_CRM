import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

interface ListToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  /** True when any non-default filter is active (not counting empty search if you prefer) */
  filtersActive: boolean
  onResetFilters: () => void
  children?: ReactNode
  onRefresh?: () => void
  className?: string
}

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filtersActive,
  onResetFilters,
  children,
  onRefresh,
  className,
}: ListToolbarProps) {
  return (
    <section className={cn('flex flex-wrap items-center gap-4', className)}>
      <div className="flex items-center flex-1 min-w-[200px] max-w-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-2 focus-within:border-electric-blue focus-within:ring-1 focus-within:ring-electric-blue">
        <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-transparent border-none outline-none text-body-sm w-full text-on-background placeholder:text-on-surface-variant"
        />
        {search && (
          <button
            type="button"
            className="text-on-surface-variant hover:text-on-background p-0.5"
            aria-label="Clear search"
            onClick={() => onSearchChange('')}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 ml-auto">
        {children}

        {filtersActive && (
          <Button type="button" variant="ghost" size="sm" onClick={onResetFilters}>
            Reset
          </Button>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface-variant hover:text-electric-blue"
            aria-label="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        )}
      </div>
    </section>
  )
}
