import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import {
  listSources,
  createSource,
  updateSource,
  deleteSource,
  type LeadSource,
} from '../../api/source'

export const SOURCES_KEY = queryKeys.sales.platforms()

/** Single coherent sources hook: list + create/update/delete mutations. */
export function useSources(opts?: { includeArchived?: boolean }) {
  const qc = useQueryClient()
  const includeArchived = opts?.includeArchived ?? false

  const query = useQuery({
    queryKey: [...SOURCES_KEY, { includeArchived }],
    queryFn: () => listSources({ includeArchived }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: SOURCES_KEY })
    void qc.invalidateQueries({ queryKey: queryKeys.sales.leads.all })
  }

  const createMut = useMutation({
    mutationFn: (input: { name: string; description?: string | null }) =>
      createSource({ name: input.name.trim(), description: input.description?.trim() || null }),
    onSuccess: () => invalidate(),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: number; input: { name?: string; description?: string | null } }) =>
      updateSource(id, {
        name: input.name?.trim(),
        description: input.description !== undefined ? input.description?.trim() || null : undefined,
      }),
    onSuccess: () => invalidate(),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteSource(id),
    onSuccess: () => invalidate(),
  })

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    metrics: query.data?.metrics ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createSource: createMut.mutateAsync,
    updateSource: updateMut.mutateAsync,
    deleteSource: deleteMut.mutateAsync,
    isMutating: createMut.isPending || updateMut.isPending || deleteMut.isPending,
    createError: createMut.error ? getApiErrorMessage(createMut.error, 'Could not create source') : null,
    updateError: updateMut.error ? getApiErrorMessage(updateMut.error, 'Could not update source') : null,
    deleteError: deleteMut.error ? getApiErrorMessage(deleteMut.error, 'Could not delete source') : null,
  }
}

export type { LeadSource }
