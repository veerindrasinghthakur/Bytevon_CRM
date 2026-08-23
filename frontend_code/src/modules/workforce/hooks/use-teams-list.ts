import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { getTeams } from '@/modules/projects/api/teams'
import type { Team as ProjectsTeam } from '@/modules/projects/types'
import type { Team, WorkforceMetric } from '../types'

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

export function useTeamsList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [drawer, setDrawer] = useState<Team | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['projects', 'teams', 'list', { search: search || undefined }],
    queryFn: () => getTeams({ search: search || undefined }),
  })

  const mapped = useMemo(
    () => (data?.items ?? []).map(toWorkforceTeam),
    [data],
  )

  const filtered = useMemo(() => {
    return mapped.filter((t) => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false
      if (
        departmentFilter !== 'All' &&
        t.department.toLowerCase() !== departmentFilter.toLowerCase()
      ) {
        return false
      }
      return true
    })
  }, [mapped, statusFilter, departmentFilter])

  const metrics = useMemo(() => buildMetrics(filtered), [filtered])

  const selection = useListSelection<Team>({
    items: filtered,
    getId: (t) => t.id,
  })

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setDepartmentFilter('All')
  }

  return {
    metrics,
    totalCount: data?.total ?? mapped.length,
    filtered,
    isLoading,
    isError,
    refetch,
    isFetching,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    resetFilters,
    drawer,
    setDrawer,
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
