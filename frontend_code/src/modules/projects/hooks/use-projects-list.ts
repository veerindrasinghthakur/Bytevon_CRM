import { useMemo } from 'react'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { computeProjectListMetrics } from '@/shared/compute/project-metrics'
import { useProjects } from './use-projects'

const FILTER_DEFAULTS = { status: '' }

export function useProjectsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const { data, isLoading, isError, refetch } = useProjects({
    search: controls.search || undefined,
    status: controls.filters.status || undefined,
  })

  const items = data?.items ?? []
  const pageItems = controls.pageItems(items)

  const selection = useListSelection({
    items: pageItems,
    getId: (p) => String(p.id),
  })

  const metrics = useMemo(() => computeProjectListMetrics(items), [items])

  return {
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: string) => controls.setFilter('status', v),
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    items,
    pageItems,
    total: metrics.total,
    active: metrics.active,
    atRisk: metrics.atRisk,
    avgProgress: metrics.avgProgress,
    isLoading,
    isError,
    refetch,
    selection,
  }
}
