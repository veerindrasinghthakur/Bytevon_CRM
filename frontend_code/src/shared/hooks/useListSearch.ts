import { useCallback, useState } from 'react'

export interface UseListSearchOptions {
  /** Initial search string */
  initial?: string
  /** Called when search changes (e.g. reset page to 1) */
  onChange?: (value: string) => void
}

export interface UseListSearchResult {
  search: string
  setSearch: (value: string) => void
  clearSearch: () => void
  hasSearch: boolean
}

/**
 * Shared search box state for list pages / list hooks.
 * Pair with ListToolbar (`search` + `onSearchChange`).
 */
export function useListSearch(options: UseListSearchOptions = {}): UseListSearchResult {
  const { initial = '', onChange } = options
  const [search, setSearchState] = useState(initial)

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
    setSearch,
    clearSearch,
    hasSearch: Boolean(search.trim()),
  }
}
