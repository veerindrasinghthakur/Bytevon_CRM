import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getEmployeeDashboard } from '../api/dashboard'

export function useEmployeeDashboard() {
  const query = useQuery({
    queryKey: queryKeys.dashboard.employee(),
    queryFn: getEmployeeDashboard,
  })

  return {
    data: query.data,
    kpis: query.data?.kpis ?? [],
    tasks: query.data?.tasks ?? [],
    leaveSummary: query.data?.leaveSummary ?? [],
    meta: query.data?.meta,
    quickActions: query.data?.quickActions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
