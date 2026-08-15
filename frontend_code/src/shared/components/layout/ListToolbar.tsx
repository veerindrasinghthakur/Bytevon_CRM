import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'

interface ListToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filterSlot?: ReactNode
  actionsSlot?: ReactNode
  className?: string
}

/** Search left · filters right — Stitch filter bar */
export function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filterSlot,
  actionsSlot,
  className,
}: ListToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3',
        className,
      )}
    >
      <div className="relative min-w-[200px] flex-1 max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(
            'w-full pl-10 pr-4 py-2',
            'bg-surface-container-lowest border border-outline-variant/50 rounded-lg',
            'text-body-md text-on-surface placeholder:text-on-surface-variant/50',
            'transition-interactive',
            'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          )}
        />
      </div>
      {(filterSlot || actionsSlot) && (
        <div className="flex flex-wrap items-center gap-2 ml-auto">{filterSlot}{actionsSlot}</div>
      )}
    </div>
  )
}
