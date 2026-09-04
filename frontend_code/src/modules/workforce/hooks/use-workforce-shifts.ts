import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { delay } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import { WORKFORCE_SHIFT_FILTER_DEFAULTS, type WorkforceShiftStatus } from '../schemas/enums'
import type { WorkforceShiftsListParams } from '../types'
import { listWorkforceShifts as getWorkforceShifts } from '../api/workforce'

async function listWorkforceShifts(params?: WorkforceShiftsListParams) {
  await delay()
  let items = getWorkforceShifts().map((s) => ({ ...s }))
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.days.toLowerCase().includes(q),
    )
  }
  if (params?.status && params.status !== 'All') {
    items = items.filter((s) => s.status === params.status)
  }
  if (params?.page != null || params?.pageSize != null) {
    return paginateItems(items, params.page, params.pageSize)
  }
  return { items, total: items.length }
}

export function useWorkforceShiftsList() {
  const controls = useListControls({
    filterDefaults: WORKFORCE_SHIFT_FILTER_DEFAULTS,
  })

  const listFilters = {
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status !== 'All' ? controls.filters.status : undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const query = useQuery({
    queryKey: queryKeys.workforce.shifts.list(listFilters),
    queryFn: () => listWorkforceShifts(listFilters),
  })

  const pageItems = query.data?.items ?? []
  const totalCount = query.data?.total ?? 0

  const filtered = useMemo(() => {
    return new Proxy(pageItems, {
      get(target, prop, receiver) {
        if (prop === 'length') return totalCount
        return Reflect.get(target, prop, receiver)
      },
    }) as typeof pageItems
  }, [pageItems, totalCount])

  return {
    items: pageItems,
    pageItems,
    filtered,
    totalCount,
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: WorkforceShiftStatus) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  }
}
