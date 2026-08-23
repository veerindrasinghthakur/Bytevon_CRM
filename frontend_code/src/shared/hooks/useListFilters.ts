import { useCallback, useMemo, useState } from 'react'

export type FilterValues = Record<string, string>

export interface UseListFiltersOptions<T extends FilterValues> {
  /** Default values for every filter key (also used by reset) */
  defaults: T
  /** Called when any filter changes (e.g. reset page to 1) */
  onChange?: () => void
}

export interface UseListFiltersResult<T extends FilterValues> {
  filters: T
  /** Set one filter by key */
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void
  /** Replace all filters */
  setFilters: (next: T) => void
  resetFilters: () => void
  /** True when any filter differs from its default */
  filtersActive: boolean
  /** Convenience: filters[key] */
  get: <K extends keyof T>(key: K) => T[K]
}

/**
 * Shared named-filter state for list pages.
 * Example:
 *   const { filters, setFilter, resetFilters, filtersActive } = useListFilters({
 *     defaults: { status: 'All', stage: 'All' },
 *   })
 */
export function useListFilters<T extends FilterValues>(
  options: UseListFiltersOptions<T>,
): UseListFiltersResult<T> {
  const { defaults, onChange } = options
  const [filters, setFiltersState] = useState<T>(defaults)

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }))
      onChange?.()
    },
    [onChange],
  )

  const setFilters = useCallback(
    (next: T) => {
      setFiltersState(next)
      onChange?.()
    },
    [onChange],
  )

  const resetFilters = useCallback(() => {
    setFiltersState(defaults)
    onChange?.()
  }, [defaults, onChange])

  const filtersActive = useMemo(() => {
    return (Object.keys(defaults) as (keyof T)[]).some(
      (k) => filters[k] !== defaults[k],
    )
  }, [filters, defaults])

  const get = useCallback(
    <K extends keyof T>(key: K) => filters[key],
    [filters],
  )

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    filtersActive,
    get,
  }
}
