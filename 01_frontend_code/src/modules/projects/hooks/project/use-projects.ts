import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
} from '../../api/project'
import type { ProjectListParams, ProjectListCache } from '../../types'
import type { CreateProjectInput, ProjectDetail } from '../../schemas/project/project'

/** Only touch list queries — never detail / teams / tasks under ['projects']. */
const PROJECT_LIST_KEY = queryKeys.projects.listPrefix()

function isListCache(old: unknown): old is ProjectListCache {
  return (
    !!old &&
    typeof old === 'object' &&
    Array.isArray((old as ProjectListCache).items)
  )
}

/** Server-side filters + pagination; query key includes params. */
export function useProjects(filters?: ProjectListParams) {
  const params: ProjectListParams = {
    search: filters?.search || undefined,
    status: filters?.status || undefined,
    teamId: filters?.teamId,
    page: filters?.page,
    pageSize: filters?.pageSize,
  }
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: () => getProjects(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  })
}

export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id!),
    queryFn: () => getProjectById(id!),
    enabled: id != null && !Number.isNaN(id),
  })
}

/** Cache strategy: optimistic + upsert on success only (no onSettled invalidate). */
export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: PROJECT_LIST_KEY })
      const previous = queryClient.getQueriesData<ProjectListCache>({
        queryKey: PROJECT_LIST_KEY,
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

      queryClient.setQueriesData<ProjectListCache>({ queryKey: PROJECT_LIST_KEY }, (old) => {
        if (!isListCache(old)) return { items: [optimistic], total: 1 }
        return { items: [optimistic, ...old.items], total: (old.total ?? old.items.length) + 1 }
      })

      return { previous, optimisticId: optimistic.id }
    },
    onError: (_err, _input, ctx) => {
      ctx?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSuccess: (created, _input, ctx) => {
      queryClient.setQueriesData<ProjectListCache>({ queryKey: PROJECT_LIST_KEY }, (old) => {
        if (!isListCache(old)) return { items: [created], total: 1 }
        return {
          items: old.items.map((p) => (p.id === ctx?.optimisticId ? created : p)),
          total: old.total ?? old.items.length,
        }
      })
      queryClient.setQueryData(queryKeys.projects.detail(created.id), created)
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
      // Only cancel list + this detail — not teams/tasks under ['projects']
      await queryClient.cancelQueries({ queryKey: PROJECT_LIST_KEY })
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.detail(id) })

      const previousLists = queryClient.getQueriesData<ProjectListCache>({
        queryKey: PROJECT_LIST_KEY,
      })
      const previousDetail = queryClient.getQueryData<ProjectDetail>(queryKeys.projects.detail(id))

      queryClient.setQueriesData<ProjectListCache>({ queryKey: PROJECT_LIST_KEY }, (old) => {
        if (!isListCache(old)) return old
        return {
          ...old,
          items: old.items.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }
      })

      if (previousDetail) {
        queryClient.setQueryData(queryKeys.projects.detail(id), {
          ...previousDetail,
          ...patch,
          // team assignment fields
          ...(patch.teamId != null
            ? { teamId: patch.teamId, teamCount: 1 }
            : {}),
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
      if (!updated?.id) return
      queryClient.setQueryData(queryKeys.projects.detail(updated.id), updated)
      queryClient.setQueriesData<ProjectListCache>({ queryKey: PROJECT_LIST_KEY }, (old) => {
        if (!isListCache(old)) return old
        return {
          ...old,
          items: old.items.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
        }
      })
    },
  })
}

// --- list controls (merged from *-list) ---
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useListControls } from '@/shared/hooks/useListControls'

const FILTER_DEFAULTS = { status: '' }

export function useProjectsList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const { data, isLoading, isFetching, isError, refetch } = useProjects({
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  })

  const pageItems = data?.items ?? []
  const total = data?.total ?? 0
  const metrics = data?.metrics

  const selection = useListSelection({
    items: pageItems,
    getId: (p) => String(p.id),
  })

  return {
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: string) => controls.setFilter('status', v),
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    /** Alias: full filtered set is no longer client-held; use pageItems for rows */
    items: pageItems,
    pageItems,
    total,
    active: metrics?.active ?? 0,
    atRisk: metrics?.atRisk ?? 0,
    avgProgress: metrics?.avgProgress ?? 0,
    isLoading,
    isFetching,
    isError,
    refetch,
    selection,
  }
}

