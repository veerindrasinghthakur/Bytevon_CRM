import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { listAdminRoles } from '../api/roles'
import { getRoleListMetrics } from '../api/metrics'
import type { AdminRole } from '../types'

const STATUS_OPTIONS = ['All', 'Active', 'Archived'] as const
const CATEGORY_OPTIONS = ['All', 'Core Role', 'Operational', 'Financial', 'Standard'] as const

export type RoleStatusFilter = (typeof STATUS_OPTIONS)[number]
export type RoleCategoryFilter = (typeof CATEGORY_OPTIONS)[number]

export function useRolesList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RoleStatusFilter>('All')
  const [categoryFilter, setCategoryFilter] = useState<RoleCategoryFilter>('All')

  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', 'list'],
    queryFn: listAdminRoles,
  })

  const metricsQuery = useQuery({
    queryKey: ['admin', 'metrics', 'roles'],
    queryFn: getRoleListMetrics,
  })

  const roles = rolesQuery.data ?? []

  const filtered = useMemo(() => {
    return roles.filter((r) => {
      if (search) {
        const q = search.toLowerCase()
        if (!r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false
      }
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (categoryFilter !== 'All' && r.category !== categoryFilter) return false
      return true
    })
  }, [roles, search, statusFilter, categoryFilter])

  const selection = useListSelection<AdminRole>({
    items: filtered,
    getId: (r) => r.id,
  })

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setCategoryFilter('All')
  }

  return {
    roles,
    filtered,
    totalCount: roles.length,
    isLoading: rolesQuery.isLoading,
    isError: rolesQuery.isError,
    refetch: rolesQuery.refetch,
    metrics: metricsQuery.data,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    statusOptions: STATUS_OPTIONS,
    categoryOptions: CATEGORY_OPTIONS,
    resetFilters,
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
