import { cn } from '@/shared/lib/cn'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import type { ListToolbarProps } from '@/shared/types'

/**
 * Shared list filter bar.
 *
 * Layout (single row): [Search] · [filter controls] · [Refresh] · [Clear]
 * If the row is tight, search + filter boxes shrink (truncate) instead of wrapping.
 *
 * - **Clear** — resets filters only (does not reload data).
 * - **Refresh** — reloads rows (refetch / reload).
 * Do not put result counts ("Showing n of m") inside this bar.
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
        // Single line always — boxes shrink when width is exceeded
        'flex flex-nowrap items-center gap-2 bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant overflow-x-auto',
        className,
      )}
    >
      <div className="relative min-w-[8rem] max-w-[16rem] flex-1 basis-[10rem] shrink">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
          search
        </span>
        <input
          value={value}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(
            'w-full min-w-0 pl-9 pr-3 py-1.5',
            'bg-surface-container-lowest border border-outline-variant rounded-lg',
            'text-body-sm text-on-surface placeholder:text-on-surface-variant/50',
            'transition-colors duration-200',
            'focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary',
          )}
        />
      </div>

      <div className="flex flex-nowrap items-center gap-1.5 min-w-0 flex-1 justify-end">
        {/* Filter controls shrink; keep actions + refresh/clear from collapsing away */}
        <div className="flex flex-nowrap items-center gap-1.5 min-w-0 overflow-hidden [&>*]:min-w-0 [&>*]:shrink [&>*]:max-w-[10rem]">
          {filters}
        </div>
        {actionsSlot ? (
          <div className="flex flex-nowrap items-center gap-1.5 shrink-0">{actionsSlot}</div>
        ) : null}

        {showRefresh && (
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className={cn(
              'p-1.5 shrink-0 bg-surface-container-lowest border border-outline-variant rounded-lg',
              'text-on-surface-variant hover:text-secondary hover:bg-surface-container',
              'transition-colors duration-200 disabled:opacity-60',
            )}
            aria-label="Refresh list"
            title="Reload rows"
          >
            <span
              className={cn(
                'material-symbols-outlined text-[18px]',
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
            className="shrink-0 !px-2"
            leftIcon={
              <span
                className={cn(
                  'material-symbols-outlined text-[16px]',
                  clearing && 'animate-spin',
                )}
              >
                filter_alt_off
              </span>
            }
          >
            {clearing ? '…' : 'Clear'}
          </Button>
        )}
      </div>
    </div>
  )
}
