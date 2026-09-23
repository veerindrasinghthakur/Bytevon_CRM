import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { listSalesActivities } from '../../api/activity'

export function useSalesActivities(opts?: { leadId?: number; limit?: number }) {
  return useQuery({
    queryKey: [...queryKeys.sales.activities(), opts ?? {}],
    queryFn: () => listSalesActivities(opts),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
