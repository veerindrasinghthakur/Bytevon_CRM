import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { listAdminRoles, restoreAdminRole } from '../../api/role'
import { getRoleListMetrics } from '../../api/attendance'
import type { AdminRole, RoleCategoryFilter, RoleStatusFilter } from '../../types'
import {
  roleFilterCategoryOptions as CATEGORY_OPTIONS,
  roleFilterStatusOptions as STATUS_OPTIONS,
} from '../../schemas/enums'

const FILTER_DEFAULTS = {
  status: 'All' as RoleStatusFilter,
  category: 'All' as RoleCategoryFilter,
}

export function useRolesList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const listParams = {
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status !== 'All' ? controls.filters.status : undefined,
    category: controls.filters.category !== 'All' ? controls.filters.category : undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const rolesQuery = useQuery({
    queryKey: queryKeys.admin.roles.list(listParams),
    queryFn: async () => {
      const result = await listAdminRoles(listParams)
      if (Array.isArray(result)) {
        return { items: result, total: result.length }
      }
      return { items: result.items ?? [], total: result.total ?? 0 }
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const metricsQuery = useQuery({
    queryKey: queryKeys.admin.roles.metrics(),
    queryFn: getRoleListMetrics,
  })

  const roles = rolesQuery.data?.items ?? []
  const totalCount = rolesQuery.data?.total ?? 0

  const selection = useListSelection<AdminRole>({
    items: roles,
    getId: (r) => r.id,
  })

  return {
    roles,
    filtered: roles,
    pageItems: roles,
    totalCount,
    isLoading: rolesQuery.isLoading,
    isFetching: rolesQuery.isFetching,
    isError: rolesQuery.isError,
    errorMessage: rolesQuery.isError
      ? getApiErrorMessage(rolesQuery.error, 'Could not load roles')
      : null,
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
    setPageSize: controls.setPageSize,
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

/** Q16: restore an archived role — same invalidation as the delete path. */
export function useRestoreAdminRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => restoreAdminRole(roleId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.roles.all })
      await qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
    },
  })
}

/** Alias kept for symmetry with the restore* naming used elsewhere. */
export const useRestoreRole = useRestoreAdminRole
