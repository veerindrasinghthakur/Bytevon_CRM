import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTeams, getTeam, createTeam, updateTeam } from '../api/teams'
import type { Team, TeamListCache } from '../types'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'

function isTeamListCache(value: unknown): value is TeamListCache {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as TeamListCache).items) &&
    typeof (value as TeamListCache).total === 'number'
  )
}

export function useTeams(filters?: { search?: string }) {
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

export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      name: string
      description?: string
      headName?: string
      headRole?: string
      memberNames?: string[]
      projectId?: number
      projectName?: string
    }) => createTeam(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teams.all })
      const previous = queryClient.getQueriesData({
        queryKey: queryKeys.teams.all,
      })

      const memberCount = (input.memberNames?.length ?? 0) + (input.headName ? 1 : 0)
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

      // Only mutate list-shaped caches — never overwrite detail/member queries
      queryClient.setQueriesData({ queryKey: queryKeys.teams.all }, (old) => {
        if (!isTeamListCache(old)) return old
        return { items: [optimistic, ...old.items], total: old.total + 1 }
      })

      return { previous, optimisticId: optimistic.id }
    },
    onError: (_err, _input, ctx) => {
      ctx?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: (created, _input, ctx) => {
      queryClient.setQueriesData({ queryKey: queryKeys.teams.all }, (old) => {
        if (!isTeamListCache(old)) return old
        return {
          items: old.items.map((t) => (t.id === ctx?.optimisticId ? created : t)),
          total: old.total,
        }
      })
      queryClient.setQueryData(queryKeys.teams.detail(created.id), created)
    },
    onSettled: () => {
      invalidate.teams(queryClient)
      invalidate.projects(queryClient)
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
      patch: Partial<Pick<Team, 'name' | 'description' | 'department' | 'headName' | 'headRole' | 'status'>>
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
    onSettled: () => {
      invalidate.teams(queryClient)
    },
  })
}
