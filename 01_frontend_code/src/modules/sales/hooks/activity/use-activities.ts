import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { listSalesActivities } from '../../api/activity'

export function useSalesActivities() {
  return useQuery({
    queryKey: queryKeys.sales.activities(),
    queryFn: listSalesActivities,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
