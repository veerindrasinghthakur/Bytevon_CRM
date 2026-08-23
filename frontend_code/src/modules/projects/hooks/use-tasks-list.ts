import { useMemo } from 'react'
import { useListControls } from '@/shared/hooks/useListControls'
import { useTasks } from './use-tasks'

const FILTER_DEFAULTS = { status: '' }

export function useTasksList(projectId?: number) {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const { data, isLoading, isError, refetch } = useTasks(
    projectId != null ? { projectId } : undefined,
  )

  const items = data?.items ?? []

  const filtered = useMemo(() => {
    const q = controls.search.toLowerCase()
    return items.filter((t) => {
      const matchQ =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.assigneeName?.toLowerCase().includes(q) ?? false)
      const matchStatus = !controls.filters.status || t.status === controls.filters.status
      return matchQ && matchStatus
    })
  }, [items, controls.search, controls.filters.status])

  const pageItems = controls.pageItems(filtered)

  return {
    items,
    filtered,
    pageItems,
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: string) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    isLoading,
    isError,
    refetch,
  }
}
