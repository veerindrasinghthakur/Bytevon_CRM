import { useMemo } from 'react'
import { useListControls } from '@/shared/hooks/useListControls'
import { useCaseStudies } from './use-sales'

const FILTER_DEFAULTS = {
  status: 'All',
}

export function useCaseStudiesList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const { data, isLoading, isFetching, isError, refetch } = useCaseStudies()

  const items = data?.items ?? []
  const metrics = data?.metrics ?? []

  const filtered = useMemo(() => {
    const q = controls.debouncedSearch.trim().toLowerCase()
    return items.filter((cs) => {
      const matchSearch =
        !q ||
        cs.title.toLowerCase().includes(q) ||
        cs.customer.toLowerCase().includes(q) ||
        cs.industry.toLowerCase().includes(q)
      const matchStatus =
        controls.filters.status === 'All' || cs.status === controls.filters.status
      return matchSearch && matchStatus
    })
  }, [items, controls.debouncedSearch, controls.filters.status])

  return {
    items,
    filtered,
    metrics,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    isLoading,
    isFetching,
    isError,
    refetch,
  }
}
