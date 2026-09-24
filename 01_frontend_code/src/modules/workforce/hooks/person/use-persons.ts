import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { listPersons, getPerson, updatePerson, type PersonUpdateInput } from '../../api/person'

export const PERSONS_KEY = [...queryKeys.workforce.employees.all, 'persons'] as const

/** Lightweight person hook (no standalone pages — Employee UI owns person flows). */
export function usePersons(opts?: { limit?: number; offset?: number }) {
  const qc = useQueryClient()
  const limit = opts?.limit ?? 100
  const offset = opts?.offset ?? 0

  const query = useQuery({
    queryKey: [...PERSONS_KEY, { limit, offset }],
    queryFn: () => listPersons({ limit, offset }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: PersonUpdateInput }) =>
      updatePerson(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PERSONS_KEY })
      void qc.invalidateQueries({ queryKey: queryKeys.workforce.employees.all })
    },
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updatePerson: updateMut.mutateAsync,
    isMutating: updateMut.isPending,
  }
}

export function usePerson(id: number | undefined) {
  return useQuery({
    queryKey: [...PERSONS_KEY, 'detail', id ?? 0],
    queryFn: () => getPerson(id!),
    enabled: id != null && Number.isFinite(id),
  })
}
