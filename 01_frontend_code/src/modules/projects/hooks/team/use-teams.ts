import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTeams,
  getTeam,
  getTeamMembers,
  createTeam,
  updateTeam,
  type CreateTeamApiInput,
} from '../../api/team'
import type { Team, TeamListCache } from '../../types'
import { queryKeys } from '@/shared/lib/query-keys'

function isTeamListCache(value: unknown): value is TeamListCache {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as TeamListCache).items) &&
    typeof (value as TeamListCache).total === 'number'
  )
}

export function useTeams(filters?: {
  search?: string
  status?: string
  department?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: queryKeys.teams.list(filters ?? {}),
    queryFn: () => getTeams(filters),
  })
}

export function useTeam(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.detail(id as number),
    queryFn: () => getTeam(id as number),
    enabled: id != null && Number.isFinite(id),
  })
}

export function useTeamMembers(teamId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.members(teamId as number),
    queryFn: () => getTeamMembers(teamId as number),
    enabled: teamId != null && Number.isFinite(teamId),
  })
}

/** Optimistic + upsert only — no onSettled invalidate (avoids race). */
export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTeamApiInput) => createTeam(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teams.all })
      const previous = queryClient.getQueriesData({
        queryKey: queryKeys.teams.all,
      })

      const memberCount =
        (input.memberEmploymentIds?.length ?? input.memberNames?.length ?? 0) +
        (input.teamHeadEmploymentId || input.headName ? 1 : 0)
      const optimistic: Team = {
        id: -Date.now(),
        name: input.name,
        description: input.description,
        department: 'Engineering',
        headName: input.headName,
        headRole: input.headRole ?? (input.headName ? 'Team Lead' : undefined),
        projectName: input.projectName,
        memberCount,
        projectCount: input.projectId ? 1 : 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueriesData({ queryKey: queryKeys.teams.all }, (old) => {
        if (!isTeamListCache(old)) return old
        return { items: [optimistic, ...old.items], total: old.total + 1 }
      })

      return { previous, optimisticId: optimistic.id }
    },
    onError: (_err, _input, ctx) => {
      ctx?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: (created, input, ctx) => {
      queryClient.setQueriesData({ queryKey: queryKeys.teams.all }, (old) => {
        if (!isTeamListCache(old)) return old
        return {
          items: old.items.map((t) => (t.id === ctx?.optimisticId ? created : t)),
          total: old.total,
        }
      })
      queryClient.setQueryData(queryKeys.teams.detail(created.id), created)
      if (input.projectId != null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(input.projectId) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      }
    },
  })
}

export function useUpdateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: number
      patch: Partial<
        Pick<Team, 'name' | 'description' | 'department' | 'headName' | 'headRole' | 'status'>
      > & { teamHeadEmploymentId?: number }
    }) => updateTeam(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teams.all })

      const previousAll = queryClient.getQueriesData({
        queryKey: queryKeys.teams.all,
      })
      const previousDetail = queryClient.getQueryData<Team>(queryKeys.teams.detail(id))

      queryClient.setQueriesData({ queryKey: queryKeys.teams.all }, (old) => {
        if (!isTeamListCache(old)) return old
        return {
          ...old,
          items: old.items.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }
      })

      if (previousDetail) {
        queryClient.setQueryData(queryKeys.teams.detail(id), {
          ...previousDetail,
          ...patch,
        })
      }

      return { previousAll, previousDetail, id }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previousAll.forEach(([key, data]) => queryClient.setQueryData(key, data))
      if (ctx?.previousDetail) {
        queryClient.setQueryData(queryKeys.teams.detail(ctx.id), ctx.previousDetail)
      }
    },
    onSuccess: (team) => {
      queryClient.setQueryData(queryKeys.teams.detail(team.id), team)
      queryClient.setQueriesData({ queryKey: queryKeys.teams.all }, (old) => {
        if (!isTeamListCache(old)) return old
        return {
          ...old,
          items: old.items.map((t) => (t.id === team.id ? team : t)),
        }
      })
    },
  })
}

// --- list controls (merged from *-list) ---
import { useListControls } from '@/shared/hooks/useListControls'

const FILTER_DEFAULTS = { status: '', department: '', dateFrom: '', dateTo: '' }

export function useTeamsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const filters = {
    search: controls.search || undefined,
    status: controls.filters.status || undefined,
    department: controls.filters.department || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const { data, isLoading, isFetching, isError, error, refetch } = useTeams(filters)

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
    department: controls.filters.department,
    setDepartment: (v: string) => controls.setFilter('department', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    dateFilter: controls.filters.dateFrom
      ? { from: controls.filters.dateFrom, to: controls.filters.dateTo }
      : undefined,
    setDateFilter: (v: { from: string; to: string }) => {
      controls.setFilter('dateFrom', v.from)
      controls.setFilter('dateTo', v.to)
    },
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  }
}

