import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getExecutiveDashboard } from '../api/dashboard'

export function useExecutiveDashboard() {
  const query = useQuery({
    queryKey: queryKeys.dashboard.executive(),
    queryFn: getExecutiveDashboard,
  })

  return {
    data: query.data,
    kpis: query.data?.kpis ?? [],
    pending: query.data?.pending ?? [],
    activities: query.data?.activities ?? [],
    meta: query.data?.meta,
    quickActions: query.data?.quickActions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
