import { useMemo, useState } from 'react'
import { paginate, DEFAULT_PAGE_SIZE } from '@/shared/components/ui/Pagination'
import { useListSelection } from '@/shared/hooks/useListSelection'
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

  const active = items.filter((p) => p.status === 'IN_PROGRESS').length
  const atRisk = items.filter((p) => p.status === 'ON_HOLD').length

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
    total,
    active,
    atRisk,
    isLoading,
    isError,
    refetch,
    selection,
  }
}
