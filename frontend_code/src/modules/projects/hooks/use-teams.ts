import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTeams, createTeam } from '../api/teams'

export function useTeams(filters?: { search?: string }) {
  return useQuery({
    queryKey: ['projects', 'teams', filters ?? {}],
    queryFn: () => getTeams(filters),
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
