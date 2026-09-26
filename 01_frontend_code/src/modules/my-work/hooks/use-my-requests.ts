import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { listMySubmittedRequests } from '../api/my-work'
import { useDataScope } from '@/shared/rbac'

/** Current user's submitted requests (read-only list). */
export function useMyRequests() {
  // Cache partitioned per data boundary; backend enforces from auth token.
  const scope = useDataScope('approval')
  const query = useQuery({
    queryKey: queryKeys.myWork.requests.list({ scope }),
    queryFn: () => listMySubmittedRequests({}),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
