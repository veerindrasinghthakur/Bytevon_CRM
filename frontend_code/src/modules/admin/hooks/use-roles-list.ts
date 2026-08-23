import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { listAdminRoles } from '../api/roles'
import { getRoleListMetrics } from '../api/metrics'
import type { AdminRole } from '../types'

const STATUS_OPTIONS = ['All', 'Active', 'Archived'] as const
const CATEGORY_OPTIONS = ['All', 'Core Role', 'Operational', 'Financial', 'Standard'] as const

export type RoleStatusFilter = (typeof STATUS_OPTIONS)[number]
export type RoleCategoryFilter = (typeof CATEGORY_OPTIONS)[number]

const FILTER_DEFAULTS = {
  status: 'All' as RoleStatusFilter,
  category: 'All' as RoleCategoryFilter,
}

export function useRolesList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const rolesQuery = useQuery({
    queryKey: queryKeys.admin.roles.list(),
    queryFn: listAdminRoles,
  })

  const metricsQuery = useQuery({
    queryKey: queryKeys.admin.roles.metrics(),
    queryFn: getRoleListMetrics,
  })

  const roles = rolesQuery.data ?? []

  const filtered = useMemo(() => {
    return roles.filter((r) => {
      if (controls.search) {
        const q = controls.search.toLowerCase()
        if (!r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false
      }
      if (controls.filters.status !== 'All' && r.status !== controls.filters.status) return false
      if (controls.filters.category !== 'All' && r.category !== controls.filters.category) return false
      return true
    })
  }, [roles, controls.search, controls.filters.status, controls.filters.category])

  const selection = useListSelection<AdminRole>({
    items: filtered,
    getId: (r) => r.id,
  })

  return {
    roles,
    filtered,
    totalCount: roles.length,
    isLoading: rolesQuery.isLoading,
    isError: rolesQuery.isError,
    refetch: rolesQuery.refetch,
    metrics: metricsQuery.data,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status as RoleStatusFilter,
    setStatusFilter: (v: RoleStatusFilter) => controls.setFilter('status', v),
    categoryFilter: controls.filters.category as RoleCategoryFilter,
    setCategoryFilter: (v: RoleCategoryFilter) => controls.setFilter('category', v),
    statusOptions: STATUS_OPTIONS,
    categoryOptions: CATEGORY_OPTIONS,
    resetFilters: controls.resetAll,
    filtersActive: controls.anyActive,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    pageItems: controls.pageItems(filtered),
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
