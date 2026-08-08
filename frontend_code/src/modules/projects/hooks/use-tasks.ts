import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, createTask, type TaskPriority } from '../api/tasks'

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
