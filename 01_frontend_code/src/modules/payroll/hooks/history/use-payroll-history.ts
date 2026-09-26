import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { listOrgPayrollHistory } from '../../api/history'
import { getPayrollEmployee } from '../../api/monthly'
import { useDataScope } from '@/shared/rbac'

const HISTORY_KEY = [...queryKeys.payroll.all, 'org-history'] as const

/** Org-wide paid payroll history (read-only). */
export function usePayrollHistory(search?: string) {
  const q = search?.trim() || undefined
  // Cache partitioned per data boundary; backend enforces from auth token.
  const scope = useDataScope('payroll')
  const query = useQuery({
    queryKey: [...HISTORY_KEY, q ?? '', scope],
    queryFn: () => listOrgPayrollHistory(q),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  return {
    records: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useHistoryEmployee(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.payroll.employees.detail(employeeId ?? ''),
    queryFn: () => getPayrollEmployee(employeeId!),
    enabled: Boolean(employeeId),
    staleTime: 60_000,
  })
}
