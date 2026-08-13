import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTeams, getTeam, createTeam, updateTeam, type Team } from '../api/teams'

export function useTeams(filters?: { search?: string }) {
  return useQuery({
    queryKey: ['projects', 'teams', filters ?? {}],
    queryFn: () => getTeams(filters),
  })
}

export function useTeam(id: number | undefined) {
  return useQuery({
    queryKey: ['projects', 'teams', id],
    queryFn: () => getTeam(id as number),
    enabled: id != null && Number.isFinite(id),
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) => createTeam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'teams'] })
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
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'teams'] })
      queryClient.setQueryData(['projects', 'teams', team.id], team)
    },
  })
}
