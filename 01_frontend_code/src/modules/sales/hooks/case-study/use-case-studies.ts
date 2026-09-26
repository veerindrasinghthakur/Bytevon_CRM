import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { listCaseStudies } from '../../api/case-study'
import type { CaseStudyListParams } from '../../types'
import { useScopeParams } from '@/shared/rbac'

/** @deprecated Prefer useCaseStudiesQuery with filters */
export function useCaseStudies() {
  return useQuery({
    queryKey: queryKeys.sales.caseStudies.list({}),
    queryFn: () => listCaseStudies(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function useCaseStudiesQuery(filters?: CaseStudyListParams) {
  const params: CaseStudyListParams = {
    search: filters?.search || undefined,
    status: filters?.status && filters.status !== 'All' ? filters.status : undefined,
    page: filters?.page,
    pageSize: filters?.pageSize,
  }
  // Scope-tagged: backend enforces the boundary; key stays partitioned per scope.
  const scopedParams = useScopeParams('lead', params)
  return useQuery({
    queryKey: queryKeys.sales.caseStudies.list(scopedParams),
    queryFn: () => listCaseStudies(scopedParams),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  })
}

const FILTER_DEFAULTS = {
  status: 'All',
}

export function useCaseStudiesList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const { data, isLoading, isFetching, isError, refetch } = useCaseStudiesQuery({
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status,
    page: controls.page,
    pageSize: controls.pageSize,
  })

  const pageItems = data?.items ?? []
  const totalCount = data?.total ?? 0
  const metrics = useMemo(() => data?.metrics ?? [], [data?.metrics])

  return {
    items: pageItems,
    /** Current page rows (server-filtered + paginated) */
    filtered: pageItems,
    pageItems,
    totalCount,
    metrics,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    isLoading,
    isFetching,
    isError,
    refetch,
  }
}
