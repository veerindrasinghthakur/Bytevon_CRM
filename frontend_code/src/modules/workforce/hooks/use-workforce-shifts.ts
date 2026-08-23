import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { shifts as shiftsSeed } from '../data/shiftsMock'
import { delay } from '@/shared/mock/db'

const FILTER_DEFAULTS = {
  status: 'All' as 'All' | 'Active' | 'Inactive',
}

async function listWorkforceShifts() {
  await delay()
  return shiftsSeed.map((s) => ({ ...s }))
}

export function useWorkforceShiftsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const query = useQuery({
    queryKey: queryKeys.workforce.shifts.list({
      search: controls.debouncedSearch,
      status: controls.filters.status,
    }),
    queryFn: listWorkforceShifts,
  })

  const items = query.data ?? []

  const filtered = useMemo(() => {
    const q = controls.debouncedSearch.toLowerCase()
    return items.filter((s) => {
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.days.toLowerCase().includes(q)
      const matchStatus =
        controls.filters.status === 'All' || s.status === controls.filters.status
      return matchQ && matchStatus
    })
  }, [items, controls.debouncedSearch, controls.filters.status])

  return {
    items,
    filtered,
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: typeof FILTER_DEFAULTS.status) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  }
}
