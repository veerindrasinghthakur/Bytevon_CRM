import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { getPositions, getPosition, createPosition, updatePosition, deletePosition, restorePosition } from '../../api/position'
import type { PositionRow } from '@/shared/schema'
import { useDataScope } from '@/shared/rbac'

function withErrorMessage<T extends { isError: boolean; error: unknown }>(q: T) {
  return {
    ...q,
    errorMessage: q.isError ? getApiErrorMessage(q.error, 'Could not load data') : null,
  }
}

/** List positions (admin settings). Uses api/position domain module. */
export function usePositions(includeArchived = true) {
  const qc = useQueryClient()
  // Cache partitioned per data boundary; backend enforces from auth token.
  const scope = useDataScope('position')
  const query = withErrorMessage(
    useQuery({
      queryKey: queryKeys.organization.positions({ includeArchived, scope }),
      queryFn: () => getPositions({ includeArchived }),
    }),
  )

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.organization.positions({ includeArchived: true }) })
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
  const restoreMut = useMutation({
    mutationFn: (id: number) => restorePosition(id),
    onSuccess: () => invalidate(),
  })

  return {
    ...query,
    createPosition: createMut.mutateAsync,
    updatePosition: updateMut.mutateAsync,
    deletePosition: deleteMut.mutateAsync,
    restorePosition: restoreMut.mutateAsync,
    isMutating: createMut.isPending || updateMut.isPending || deleteMut.isPending || restoreMut.isPending,
  }
}

export function usePositionDetail(id: number | undefined) {
  const qc = useQueryClient()
  const query = withErrorMessage(
    useQuery({
      queryKey: [...queryKeys.organization.positions({ includeArchived: true }), 'detail', String(id ?? 0)],
      queryFn: () => getPosition(id!),
      enabled: id != null && Number.isFinite(id),
    }),
  )

  const deleteMut = useMutation({
    mutationFn: () => deletePosition(id!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.organization.positions({ includeArchived: true }) })
    },
  })

  const restoreMut = useMutation({
    mutationFn: () => restorePosition(id!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.organization.positions({ includeArchived: true }) })
    },
  })

  return {
    ...query,
    deletePosition: deleteMut.mutateAsync,
    // Deprecated alias
    archivePosition: deleteMut.mutateAsync,
    restorePosition: restoreMut.mutateAsync,
    isMutating: deleteMut.isPending || restoreMut.isPending,
  }
}

export type { PositionRow }
