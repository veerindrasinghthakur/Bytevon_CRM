import { cn } from '@/shared/lib/cn'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { ListToolbarProps } from '@/shared/types'



/** Search left · filters right — shared list filter bar */
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
  const [resetting, setResetting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleReset = async () => {
    if (!onResetFilters || resetting) return
    setResetting(true)
    try {
      await Promise.resolve(onResetFilters())
      // brief visual feedback even for sync resets
      await new Promise((r) => setTimeout(r, 350))
    } finally {
      setResetting(false)
    }
  }

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    try {
      await Promise.resolve(onRefresh())
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant',
        className,
      )}
    >
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
        {(filtersActive || onResetFilters) && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleReset()}
            disabled={resetting}
            leftIcon={
              <span
                className={cn(
                  'material-symbols-outlined text-[18px]',
                  resetting && 'animate-spin',
                )}
              >
                restart_alt
              </span>
            }
          >
            {resetting ? 'Resetting…' : 'Reset'}
          </Button>
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors duration-200 disabled:opacity-60"
            aria-label="Refresh"
          >
            <span
              className={cn(
                'material-symbols-outlined text-[20px]',
                refreshing && 'animate-spin',
              )}
            >
              refresh
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
