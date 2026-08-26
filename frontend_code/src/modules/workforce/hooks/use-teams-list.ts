import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'
import { getTeams } from '@/modules/projects/api/teams'
import type { Team as ProjectsTeam } from '@/modules/projects/types'
import type { Team, WorkforceMetric } from '../types'
import { queryKeys } from '@/shared/lib/query-keys'

/** Map projects Team (canonical) → workforce Team shape used by list UI */
function toWorkforceTeam(t: ProjectsTeam): Team {
  return {
    id: String(t.id),
    name: t.name,
    description: t.description,
    departmentId: '',
    department: t.department ?? '—',
    headName: t.headName ?? 'Unassigned',
    headTitle: t.headRole,
    memberCount: t.memberCount,
    projectCount: t.projectCount,
    status: t.status === 'ACTIVE' ? 'Active' : 'Inactive',
    createdOn: t.createdAt,
    icon: 'groups',
  }
}

function buildMetrics(items: Team[]): WorkforceMetric[] {
  const total = items.length
  const activeMembers = items.reduce((s, t) => s + t.memberCount, 0)
  const totalProjects = items.reduce((s, t) => s + t.projectCount, 0)
  const avgSize = total > 0 ? (activeMembers / total).toFixed(1) : '0'
  return [
    { id: 'total', label: 'Total Teams', value: String(total), icon: 'groups' },
    { id: 'members', label: 'Active Members', value: String(activeMembers), icon: 'person' },
    { id: 'projects', label: 'Total Projects', value: String(totalProjects), icon: 'account_tree' },
    { id: 'avg', label: 'Avg. Team Size', value: avgSize, subtitle: 'Members', icon: 'group_work' },
  ]
}

const FILTER_DEFAULTS = {
  status: 'All',
  department: 'All',
}

export function useTeamsList() {
  const [createOpen, setCreateOpen] = useState(false)

  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const listFilters = {
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status !== 'All' ? controls.filters.status : undefined,
    department: controls.filters.department !== 'All' ? controls.filters.department : undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.teams.list(listFilters),
    queryFn: () =>
      getTeams({
        search: listFilters.search,
        // Teams API supports search; status/department applied client-side until API expands
        page: undefined,
        pageSize: undefined,
      }),
  })

  const mapped = useMemo(() => (data?.items ?? []).map(toWorkforceTeam), [data])

  const filtered = useMemo(() => {
    return mapped.filter((t) => {
      if (listFilters.status && t.status !== listFilters.status) return false
      if (
        listFilters.department &&
        t.department.toLowerCase() !== listFilters.department.toLowerCase()
      ) {
        return false
      }
      return true
    })
  }, [mapped, listFilters.status, listFilters.department])

  const metrics = useMemo(() => buildMetrics(filtered), [filtered])
  const pageItems = controls.pageItems(filtered)

  const selection = useListSelection<Team>({
    items: pageItems,
    getId: (t) => t.id,
  })

  return {
    metrics,
    totalCount: filtered.length,
    filtered,
    pageItems,
    isLoading,
    isError,
    refetch,
    isFetching,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    departmentFilter: controls.filters.department,
    setDepartmentFilter: (v: string) => controls.setFilter('department', v),
    resetFilters: controls.resetAll,
    filtersActive: controls.anyActive,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    createOpen,
    setCreateOpen,
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
