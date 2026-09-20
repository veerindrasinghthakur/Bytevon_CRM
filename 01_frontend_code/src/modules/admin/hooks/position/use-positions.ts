import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { getPositions, getPosition, createPosition, updatePosition, deletePosition } from '../../api/position'
import type { PositionRow } from '@/shared/schema'

function withErrorMessage<T extends { isError: boolean; error: unknown }>(q: T) {
  return {
    ...q,
    errorMessage: q.isError ? getApiErrorMessage(q.error, 'Could not load data') : null,
  }
}

/** List positions (admin settings). Uses api/position domain module. */
export function usePositions(includeArchived = true) {
  const qc = useQueryClient()
  const query = withErrorMessage(
    useQuery({
      queryKey: queryKeys.organization.positions(includeArchived),
      queryFn: () => getPositions({ includeArchived }),
    }),
  )

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.organization.positions(true) })
  }

  const createMut = useMutation({
    mutationFn: (input: { name: string }) => createPosition(input),
    onSuccess: () => invalidate(),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof updatePosition>[1] }) =>
      updatePosition(id, patch),
    onSuccess: () => invalidate(),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deletePosition(id),
    onSuccess: () => invalidate(),
  })

  return {
    ...query,
    createPosition: createMut.mutateAsync,
    updatePosition: updateMut.mutateAsync,
    deletePosition: deleteMut.mutateAsync,
    isMutating: createMut.isPending || updateMut.isPending || deleteMut.isPending,
  }
}

export function usePositionDetail(id: number | undefined) {
  const qc = useQueryClient()
  const query = withErrorMessage(
    useQuery({
      queryKey: [...queryKeys.organization.positions(true), 'detail', String(id ?? 0)],
      queryFn: () => getPosition(id!),
      enabled: id != null && Number.isFinite(id),
    }),
  )

  const deleteMut = useMutation({
    mutationFn: () => deletePosition(id!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.organization.positions(true) })
    },
  })

  return {
    ...query,
    deletePosition: deleteMut.mutateAsync,
    // Deprecated alias
    archivePosition: deleteMut.mutateAsync,
    isMutating: deleteMut.isPending,
  }
}

export type { PositionRow }
