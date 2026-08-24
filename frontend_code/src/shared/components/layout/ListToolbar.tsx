import { cn } from '@/shared/lib/cn'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import type { ListToolbarProps } from '@/shared/types'

/**
 * Shared list filter bar.
 *
 * Layout: [Search] · [filter controls as children] · [Refresh] · [Clear]
 *
 * - **Clear** — resets filters only (does not reload data).
 * - **Refresh** — reloads rows (refetch / reload).
 * Both sit at the right of the filter controls when handlers are provided.
 * Do not put result counts ("Showing n of m") inside this bar — put them under the table/list.
 */
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
  const [clearing, setClearing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  /** Clear filters only — never reloads rows. */
  const handleClear = async () => {
    if (!onResetFilters || clearing) return
    setClearing(true)
    try {
      await Promise.resolve(onResetFilters())
      await new Promise((r) => setTimeout(r, 200))
    } finally {
      setClearing(false)
    }
  }

  /** Reload rows only — does not reset filters. */
  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    try {
      await Promise.resolve(onRefresh())
    } finally {
      setRefreshing(false)
    }
  }

  const showClear = Boolean(onResetFilters)
  const showRefresh = Boolean(onRefresh)

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

        {/* Refresh first, Clear to its right (product standard) */}
        {showRefresh && (
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className={cn(
              'p-2 bg-surface-container-lowest border border-outline-variant rounded-lg',
              'text-on-surface-variant hover:text-secondary hover:bg-surface-container',
              'transition-colors duration-200 disabled:opacity-60',
            )}
            aria-label="Refresh list"
            title="Reload rows"
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

        {showClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleClear()}
            disabled={clearing || (filtersActive === false && !clearing)}
            title="Clear filters"
            leftIcon={
              <span
                className={cn(
                  'material-symbols-outlined text-[18px]',
                  clearing && 'animate-spin',
                )}
              >
                filter_alt_off
              </span>
            }
          >
            {clearing ? 'Clearing…' : 'Clear'}
          </Button>
        )}
      </div>
    </div>
  )
}
