import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { listAdminUsers } from '../../api/user'
import type { AdminUserListItem } from '../../types'

const FILTER_DEFAULTS = {
  status: 'All' as 'All' | 'Active' | 'Inactive' | 'Locked',
  department: 'All',
  role: 'All',
  dateFrom: '',
  dateTo: '',
}


export function useUsersList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const listParams = {
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status !== 'All' ? controls.filters.status : undefined,
    department: controls.filters.department !== 'All' ? controls.filters.department : undefined,
    role: controls.filters.role !== 'All' ? controls.filters.role : undefined,
    dateFrom: controls.filters.dateFrom || undefined,
    dateTo: controls.filters.dateTo || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users.list(listParams),
    queryFn: () => listAdminUsers(listParams),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  })

  const pageItems = usersQuery.data?.items ?? []
  const total = usersQuery.data?.total ?? 0
  const locked = usersQuery.data?.locked ?? 0
  const active = usersQuery.data?.active ?? 0
  const departments = usersQuery.data?.departments ?? []
  const roles = usersQuery.data?.roles ?? []

  const selection = useListSelection<AdminUserListItem>({
    items: pageItems,
    getId: (u) => String(u.id),
  })

  return {
    /** Page rows (server-paginated) */
    items: pageItems,
    filtered: pageItems,
    pageItems,
    totalCount: total,
    locked,
    active,
    departments,
    roles,
    isLoading: usersQuery.isLoading,
    isFetching: usersQuery.isFetching,
    isError: usersQuery.isError,
    refetch: usersQuery.refetch,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: typeof FILTER_DEFAULTS.status) => controls.setFilter('status', v),
    departmentFilter: controls.filters.department,
    setDepartmentFilter: (v: string) => controls.setFilter('department', v),
    roleFilter: controls.filters.role,
    setRoleFilter: (v: string) => controls.setFilter('role', v),
    dateFrom: controls.filters.dateFrom,
    dateTo: controls.filters.dateTo,
    setDateRange: (from: string, to: string) => {
      controls.setFilter('dateFrom', from)
      controls.setFilter('dateTo', to)
    },
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
