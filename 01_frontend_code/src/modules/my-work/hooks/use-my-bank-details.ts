import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getEmployeeBankDetails } from '@/modules/workforce/api/bank'
import { useAuth } from '@/modules/auth/context/AuthContext'

/** Read-only view of the current user's bank details (HR-owned record). */
export function useMyBankDetails() {
  const { employmentId } = useAuth()

  const query = useQuery({
    queryKey: queryKeys.workforce.employees.bankDetails(employmentId ?? 0),
    queryFn: () => getEmployeeBankDetails(employmentId!),
    enabled: Boolean(employmentId),
    staleTime: 60_000,
  })

  return {
    saved: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
