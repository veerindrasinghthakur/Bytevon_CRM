import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  type Task,
  type TaskPriority,
} from '../api/tasks'

export function useTasks(filters?: {
  search?: string
  status?: string
  projectId?: number
}) {
  return useQuery({
    queryKey: ['projects', 'tasks', filters ?? {}],
    queryFn: () => getTasks(filters),
  })
}

export function useTask(id: number | undefined) {
  return useQuery({
    queryKey: ['projects', 'tasks', id],
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
    }) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'tasks'] })
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
      >
    }) => updateTask(id, patch),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'tasks'] })
      queryClient.setQueryData(['projects', 'tasks', task.id], task)
    },
  })
}
