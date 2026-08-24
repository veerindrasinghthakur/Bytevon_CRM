import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { listAdminUsers } from '../api/users'
import type { AdminUserListItem } from '../types'

const FILTER_DEFAULTS = {
  status: 'All' as 'All' | 'Active' | 'Inactive' | 'Locked',
  department: 'All',
  role: 'All',
  dateFrom: '',
  dateTo: '',
}

function inDateRange(iso: string | null, from: string, to: string): boolean {
  if (!from && !to) return true
  if (!iso) return false
  const day = iso.slice(0, 10)
  if (from && day < from) return false
  if (to && day > to) return false
  return true
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

  const departments = useMemo(() => {
    const set = new Set(items.map((u) => u.department).filter((d) => d && d !== '—'))
    return Array.from(set).sort()
  }, [items])

  const roles = useMemo(() => {
    const set = new Set(items.map((u) => u.role).filter((r) => r && r !== '—'))
    return Array.from(set).sort()
  }, [items])

  const filtered = useMemo(() => {
    const q = controls.search.trim().toLowerCase()
    const { status, department, role, dateFrom, dateTo } = controls.filters
    return items.filter((u) => {
      if (q) {
        const match =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.employeeCode.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
        if (!match) return false
      }
      if (status !== 'All' && u.status !== status) return false
      if (department !== 'All' && u.department !== department) return false
      if (role !== 'All' && u.role !== role) return false
      if (!inDateRange(u.lastLoginAt, dateFrom, dateTo)) return false
      return true
    })
  }, [items, controls.search, controls.filters])

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
