import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, getProjectById, createProject } from '../api/projects'
import type { CreateProjectInput } from '../schemas/project'

export function useProjects(filters?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ['projects', 'list', filters ?? {}],
    queryFn: () => getProjects(filters),
  })
}

export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: ['projects', 'detail', id],
    queryFn: () => getProjectById(id!),
    enabled: id != null && !Number.isNaN(id),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] })
    },
  })
}