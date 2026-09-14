import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, getTask, createTask, updateTask } from '../api/tasks'
import type { Task, TaskPriority, TaskListCache } from '../types'
import { queryKeys } from '@/shared/lib/query-keys'

function asListCache(old: TaskListCache | undefined | null, fallbackItems: Task[] = []): TaskListCache {
  if (!old) return { items: fallbackItems, total: fallbackItems.length }
  const items = Array.isArray(old.items) ? old.items : fallbackItems
  return { items, total: typeof old.total === 'number' ? old.total : items.length }
}

export function useTasks(filters?: {
  search?: string
  status?: string
  projectId?: number
  projectName?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters ?? {}),
    queryFn: () => getTasks(filters),
    enabled: filters !== undefined,
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
        const base = asListCache(old)
        return { items: [optimistic, ...base.items], total: base.total + 1 }
      })

      return { previous, optimisticId: optimistic.id }
    },
    onError: (_err, _input, ctx) => {
      ctx?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: (created, _input, ctx) => {
      queryClient.setQueriesData<TaskListCache>({ queryKey: queryKeys.tasks.all }, (old) => {
        const base = asListCache(old, [created])
        return {
          items: base.items.map((t) => (t.id === ctx?.optimisticId ? created : t)),
          total: base.total,
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
        const items = Array.isArray(old.items) ? old.items : []
        return {
          ...old,
          items: items.map((t) => (t.id === id ? { ...t, ...patch } : t)),
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
      if (!task?.id) return
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task)
      queryClient.setQueriesData<TaskListCache>({ queryKey: queryKeys.tasks.all }, (old) => {
        if (!old) return old
        const items = Array.isArray(old.items) ? old.items : []
        return {
          ...old,
          items: items.map((t) => (t.id === task.id ? task : t)),
        }
      })
    },
  })
}
