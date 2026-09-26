import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { queryKeys } from '@/shared/lib/query-keys'
import { listMyTasks } from '../api/my-work'
import type { MyTask } from '../types'
import { useScopeParams } from '@/shared/rbac'

const FILTER_DEFAULTS = {
  status: 'All',
}

export function useMyTasks() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
    pageSize: 20,
  })

  const params = {
    search: controls.debouncedSearch || undefined,
    status: controls.filters.status !== 'All' ? controls.filters.status : undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  // Scope-tagged (SELF for self-service); key stays partitioned per scope.
  const scopedParams = useScopeParams('task', params)

  const query = useQuery({
    queryKey: queryKeys.myWork.tasks.list(scopedParams),
    queryFn: () => listMyTasks(scopedParams),
    placeholderData: (prev) => prev,
  })

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  const selection = useListSelection<MyTask>({
    items,
    getId: (t) => String(t.id),
  })

  return {
    tasks: items,
    total,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    setPageSize: controls.setPageSize,
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    selectionMode: selection.selectionMode,
    selectedIds: selection.selectedIds,
    selectedCount: selection.selectedCount,
    allFilteredSelected: selection.allFilteredSelected,
    toggleOne: selection.toggleOne,
    toggleSelectAllFiltered: selection.toggleSelectAllFiltered,
    exitSelectionMode: selection.exitSelectionMode,
    onRowPressStart: selection.onRowPressStart,
    onRowPressEnd: selection.onRowPressEnd,
    onRowPressCancel: selection.onRowPressCancel,
  }
}
