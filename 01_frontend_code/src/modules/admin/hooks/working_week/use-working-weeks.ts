import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  getWorkingWeeks,
  createWorkingWeek,
  archiveWorkingWeek,
} from '../../api/working-week'

const WEEKS_KEY = ['organization', 'working-weeks'] as const

/** Working weeks (versioned config): list + create + close-version. */
export function useWorkingWeeks() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: WEEKS_KEY,
    queryFn: getWorkingWeeks,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: WEEKS_KEY })
  }

  const createMut = useMutation({
    mutationFn: createWorkingWeek,
    onSuccess: () => invalidate(),
  })
  const closeMut = useMutation({
    mutationFn: (id: number) => archiveWorkingWeek(id),
    onSuccess: () => invalidate(),
  })

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createWorkingWeek: createMut.mutateAsync,
    closeWorkingWeek: closeMut.mutateAsync,
    // Deprecated alias (version close, not soft-delete)
    archiveWorkingWeek: closeMut.mutateAsync,
    isMutating: createMut.isPending || closeMut.isPending,
  }
}
