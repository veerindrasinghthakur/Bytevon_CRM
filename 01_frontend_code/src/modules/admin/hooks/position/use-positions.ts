import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { getPositions, getPosition } from '../../api/position'
import type { PositionRow } from '@/shared/schema'

function withErrorMessage<T extends { isError: boolean; error: unknown }>(q: T) {
  return {
    ...q,
    errorMessage: q.isError ? getApiErrorMessage(q.error, 'Could not load data') : null,
  }
}

/** List positions (admin settings). Uses api/position domain module. */
export function usePositions(includeArchived = true) {
  return withErrorMessage(
    useQuery({
      queryKey: queryKeys.organization.positions(includeArchived),
      queryFn: () => getPositions({ includeArchived }),
    }),
  )
}

export function usePositionDetail(id: number | undefined) {
  return withErrorMessage(
    useQuery({
      queryKey: queryKeys.organization.positions(true).concat(String(id ?? 0)),
      queryFn: () => getPosition(id!),
      enabled: id != null && Number.isFinite(id),
    }),
  )
}

export type { PositionRow }
