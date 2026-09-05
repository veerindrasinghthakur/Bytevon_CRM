import { useListControls } from '@/shared/hooks/useListControls'
import { useTasks } from './use-tasks'

const FILTER_DEFAULTS = { status: '', priority: '' }

export function useTasksList(projectId?: number) {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const filters = {
    ...(projectId != null ? { projectId } : {}),
    search: controls.search || undefined,
    status: controls.filters.status || undefined,
    priority: controls.filters.priority || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const { data, isLoading, isError, refetch } = useTasks(filters)

  const items = data?.items ?? []
  const total = data?.total ?? items.length

  return {
    items,
    filtered: items,
    pageItems: items,
    totalCount: total,
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: string) => controls.setFilter('status', v),
    priority: controls.filters.priority,
    setPriority: (v: string) => controls.setFilter('priority', v),
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
