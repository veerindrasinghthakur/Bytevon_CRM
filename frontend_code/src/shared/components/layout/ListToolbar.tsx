import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'

interface ListToolbarProps {
  searchValue?: string
  search?: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filterSlot?: ReactNode
  actionsSlot?: ReactNode
  children?: ReactNode
  filtersActive?: boolean
  onResetFilters?: () => void
  onRefresh?: () => void
  className?: string
}

/** Search left · filters right — HTML-aligned focus ring + hover */
export function ListToolbar({
  searchValue,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filterSlot,
  actionsSlot,
  children,
  filtersActive,
  onResetFilters,
  onRefresh,
  className,
}: ListToolbarProps) {
  const value = searchValue ?? search ?? ''
  const filters = filterSlot ?? children

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="relative min-w-[200px] flex-1 max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          value={value}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(
            'w-full pl-10 pr-4 py-2',
            'bg-surface-container-lowest border border-outline-variant rounded-lg',
            'text-body-md text-on-surface placeholder:text-on-surface-variant/50',
            'transition-colors duration-200',
            'focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary',
          )}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        {filters}
        {actionsSlot}
        {filtersActive && onResetFilters && (
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            Reset
          </Button>
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors duration-200"
            aria-label="Refresh"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        )}
      </div>
    </div>
  )
}
