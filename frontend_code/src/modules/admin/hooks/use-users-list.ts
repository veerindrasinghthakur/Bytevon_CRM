import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { listAdminUsers, type AdminUserListItem } from '../api/users'

const FILTER_DEFAULTS = {
  status: 'All' as 'All' | 'Active' | 'Inactive' | 'Locked',
}

export function useUsersList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users.list(),
    queryFn: () => listAdminUsers(),
  })

  const items = usersQuery.data?.items ?? []
  const locked = usersQuery.data?.locked ?? 0
  const active = usersQuery.data?.active ?? 0

  const filtered = useMemo(() => {
    const q = controls.search.trim().toLowerCase()
    return items.filter((u) => {
      if (q) {
        const match =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.employeeCode.toLowerCase().includes(q)
        if (!match) return false
      }
      if (controls.filters.status !== 'All' && u.status !== controls.filters.status) return false
      return true
    })
  }, [items, controls.search, controls.filters.status])

  const pageItems = controls.pageItems(filtered)

  const selection = useListSelection<AdminUserListItem>({
    items: pageItems,
    getId: (u) => String(u.id),
  })

  return {
    items,
    filtered,
    pageItems,
    totalCount: items.length,
    locked,
    active,
    isLoading: usersQuery.isLoading,
    isFetching: usersQuery.isFetching,
    isError: usersQuery.isError,
    refetch: usersQuery.refetch,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: typeof FILTER_DEFAULTS.status) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    selectionMode: selection.selectionMode,
    selectedIds: selection.selectedIds,
    selectedCount: selection.selectedCount,
    allFilteredSelected: selection.allFilteredSelected,
    isSelected: selection.isSelected,
    toggleOne: selection.toggleOne,
    toggleSelectAllFiltered: selection.toggleSelectAllFiltered,
    exitSelectionMode: selection.exitSelectionMode,
    onRowPressStart: selection.onRowPressStart,
    onRowPressEnd: selection.onRowPressEnd,
    onRowPressCancel: selection.onRowPressCancel,
  }
}
