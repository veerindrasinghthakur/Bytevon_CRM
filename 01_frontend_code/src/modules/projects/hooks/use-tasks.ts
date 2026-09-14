import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, getTask, createTask, updateTask } from '../api/tasks'
import type { Task, TaskPriority, TaskListCache } from '../types'
import { queryKeys } from '@/shared/lib/query-keys'

export function useTasks(filters?: {
  search?: string
  status?: string
  projectId?: number
  projectName?: string
  page?: number
  pageSize?: number
  /** When false, skip fetch (e.g. project detail until Tasks tab). Default true if filters defined. */
  enabled?: boolean
}) {
  const enabled =
    filters?.enabled !== false &&
    filters != null &&
    (filters.projectId != null ||
      filters.projectName != null ||
      filters.search != null ||
      filters.status != null ||
      filters.page != null ||
      // list page: empty filters object still means "fetch all"
      Object.keys(filters).length === 0 ||
      filters.enabled === true)

  return useQuery({
    queryKey: queryKeys.tasks.list(filters ?? {}),
    queryFn: () => getTasks(filters),
    enabled,
  })
}

export function useTask(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id as number),
    queryFn: () => getTask(id as number),
    enabled: id != null && Number.isFinite(id),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      title: string
      description?: string
      priority?: TaskPriority
      projectId?: number
      projectName?: string
      assigneeName?: string
      assigneeEmploymentId?: number | null
    }) => createTask(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })
      const previous = queryClient.getQueriesData<TaskListCache>({
        queryKey: queryKeys.tasks.all,
      })

      const optimistic: Task = {
        id: -Date.now(),
        title: input.title,
        description: input.description,
        priority: input.priority ?? 'MEDIUM',
        status: 'TODO',
        projectId: input.projectId ?? 0,
        projectName: input.projectName,
        assigneeName: input.assigneeName,
        dueDate: null,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueriesData<TaskListCache>({ queryKey: queryKeys.tasks.all }, (old) => {
        if (!old) return { items: [optimistic], total: 1 }
        return { items: [optimistic, ...old.items], total: old.total + 1 }
      })

      return { previous, optimisticId: optimistic.id }
    },
    onError: (_err, _input, ctx) => {
      ctx?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: (created, _input, ctx) => {
      queryClient.setQueriesData<TaskListCache>({ queryKey: queryKeys.tasks.all }, (old) => {
        if (!old) return { items: [created], total: 1 }
        return {
          items: old.items.map((t) => (t.id === ctx?.optimisticId ? created : t)),
          total: old.total,
        }
      })
      queryClient.setQueryData(queryKeys.tasks.detail(created.id), created)
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: number
      patch: Partial<
        Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'assigneeName' | 'dueDate'>
      > & { assigneeEmploymentId?: number | null }
    }) => updateTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })

      const previousLists = queryClient.getQueriesData<TaskListCache>({
        queryKey: queryKeys.tasks.all,
      })
      const previousDetail = queryClient.getQueryData<Task>(queryKeys.tasks.detail(id))

      queryClient.setQueriesData<TaskListCache>({ queryKey: queryKeys.tasks.all }, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }
      })

      if (previousDetail) {
        queryClient.setQueryData(queryKeys.tasks.detail(id), {
          ...previousDetail,
          ...patch,
        })
      }

      return { previousLists, previousDetail, id }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data))
      if (ctx?.previousDetail) {
        queryClient.setQueryData(queryKeys.tasks.detail(ctx.id), ctx.previousDetail)
      }
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task)
      queryClient.setQueriesData<TaskListCache>({ queryKey: queryKeys.tasks.all }, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((t) => (t.id === task.id ? task : t)),
        }
      })
    },
  })
}
