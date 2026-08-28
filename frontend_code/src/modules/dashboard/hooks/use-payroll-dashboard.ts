import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getPayrollDashboard } from '../api/dashboard'

export function usePayrollDashboard() {
  const query = useQuery({
    queryKey: queryKeys.dashboard.payroll(),
    queryFn: getPayrollDashboard,
  })

  return {
    data: query.data,
    kpis: query.data?.kpis ?? [],
    trendData: query.data?.trendData ?? [],
    departmentCosts: query.data?.departmentCosts ?? [],
    pendingApprovals: query.data?.pendingApprovals ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}