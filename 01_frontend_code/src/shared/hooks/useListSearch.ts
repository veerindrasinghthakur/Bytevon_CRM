import { useCallback, useState } from 'react'
import { useDebounce } from './useDebounce'

export interface UseListSearchOptions {
  /** Initial search string */
  initial?: string
  /** Debounce delay in ms (default 300) */
  debounceMs?: number
  /** Called when search changes (e.g. reset page to 1) */
  onChange?: (value: string) => void
}

export interface UseListSearchResult {
  search: string
  debouncedSearch: string
  setSearch: (value: string) => void
  clearSearch: () => void
  hasSearch: boolean
}

/**
 * Shared search box state for list pages / list hooks.
 * Pair with ListToolbar (`search` + `onSearchChange`).
 */
export function useListSearch(options: UseListSearchOptions = {}): UseListSearchResult {
  const { initial = '', debounceMs = 300, onChange } = options
  const [search, setSearchState] = useState(initial)
  const debouncedSearch = useDebounce(search, debounceMs)

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value)
      onChange?.(value)
    },
    [onChange],
  )

  const clearSearch = useCallback(() => {
    setSearchState('')
    onChange?.('')
  }, [onChange])

  return {
    search,
    debouncedSearch,
    setSearch,
    clearSearch,
    hasSearch: Boolean(search.trim()),
  }
}
