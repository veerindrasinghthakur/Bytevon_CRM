import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
} from '../api/projects'
import type { CreateProjectInput, ProjectDetail, ProjectListItem } from '../schemas/project'

type ProjectListCache = { items: ProjectListItem[]; total: number }

export function useProjects(filters?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => getProjects(filters),
  })
}

export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id!),
    queryFn: () => getProjectById(id!),
    enabled: id != null && !Number.isNaN(id),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.all })
      const previous = queryClient.getQueriesData<ProjectListCache>({
        queryKey: queryKeys.projects.all,
      })

      const optimistic: ProjectDetail = {
        id: -Date.now(),
        name: input.name,
        code: input.code || 'PRJ-…',
        status: 'PLANNING',
        clientName: input.clientName ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        progress: 0,
        teamCount: 0,
        taskCount: 0,
        description: input.description ?? null,
        repositoryUrl: input.repositoryUrl ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueriesData<ProjectListCache>({ queryKey: queryKeys.projects.all }, (old) => {
        if (!old) return { items: [optimistic], total: 1 }
        return { items: [optimistic, ...old.items], total: old.total + 1 }
      })

      return { previous, optimisticId: optimistic.id }
    },
    onError: (_err, _input, ctx) => {
      ctx?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSuccess: (created, _input, ctx) => {
      queryClient.setQueriesData<ProjectListCache>({ queryKey: queryKeys.projects.all }, (old) => {
        if (!old) return { items: [created], total: 1 }
        return {
          items: old.items.map((p) => (p.id === ctx?.optimisticId ? created : p)),
          total: old.total,
        }
      })
      queryClient.setQueryData(queryKeys.projects.detail(created.id), created)
    },
    onSettled: () => {
      invalidate.projects(queryClient)
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: number
      patch: Parameters<typeof updateProject>[1]
    }) => updateProject(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.all })

      const previousLists = queryClient.getQueriesData<ProjectListCache>({
        queryKey: queryKeys.projects.all,
      })
      const previousDetail = queryClient.getQueryData<ProjectDetail>(queryKeys.projects.detail(id))

      queryClient.setQueriesData<ProjectListCache>({ queryKey: queryKeys.projects.all }, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }
      })

      if (previousDetail) {
        queryClient.setQueryData(queryKeys.projects.detail(id), {
          ...previousDetail,
          ...patch,
          updatedAt: new Date().toISOString(),
        })
      }

      return { previousLists, previousDetail, id }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data))
      if (ctx?.previousDetail) {
        queryClient.setQueryData(queryKeys.projects.detail(ctx.id), ctx.previousDetail)
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.projects.detail(updated.id), updated)
      queryClient.setQueriesData<ProjectListCache>({ queryKey: queryKeys.projects.all }, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
        }
      })
    },
    onSettled: () => {
      invalidate.projects(queryClient)
    },
  })
}
