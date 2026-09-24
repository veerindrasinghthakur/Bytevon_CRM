import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { listLeaveLedger } from '../../api/leave'

/** Append-only leave balance history (read-only). */
export function useLeaveLedger(employeeId?: string) {
  const query = useQuery({
    queryKey: queryKeys.admin.leave.ledger({ employeeId: employeeId ?? 'all' }),
    queryFn: () => listLeaveLedger(employeeId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  return {
    ledger: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
