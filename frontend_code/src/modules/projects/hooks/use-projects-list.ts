import { useMemo, useState } from 'react'
import { paginate, DEFAULT_PAGE_SIZE } from '@/shared/components/ui/Pagination'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { computeProjectListMetrics } from '@/shared/compute/project-metrics'
import { useProjects } from './use-projects'

export function useProjectsList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useProjects({
    search: search || undefined,
    status: status || undefined,
  })

  const filtersActive = Boolean(search || status)

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setPage(1)
  }

  const items = data?.items ?? []
  const total = items.length
  const pageItems = useMemo(() => paginate(items, page, DEFAULT_PAGE_SIZE), [items, page])

  const selection = useListSelection({
    items: pageItems,
    getId: (p) => String(p.id),
  })

  const metrics = useMemo(() => computeProjectListMetrics(items), [items])

  const setSearchAndResetPage = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const setStatusAndResetPage = (v: string) => {
    setStatus(v)
    setPage(1)
  }

  return {
    search,
    setSearch: setSearchAndResetPage,
    status,
    setStatus: setStatusAndResetPage,
    page,
    setPage,
    filtersActive,
    resetFilters,
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
