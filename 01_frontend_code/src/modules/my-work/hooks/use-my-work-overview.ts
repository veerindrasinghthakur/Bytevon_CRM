import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getMyWorkOverview } from '../api/my-work'

export function useMyWorkOverview() {
  const query = useQuery({
    queryKey: queryKeys.myWork.overview(),
    queryFn: getMyWorkOverview,
  })

  return {
    data: query.data,
    user: query.data?.user,
    metrics: query.data?.metrics ?? [],
    todayAttendance: query.data?.todayAttendance,
    weekHours: Array.isArray(query.data?.weekHours) ? (query.data?.weekHours ?? []) : [],
    leaveBalances: query.data?.leaveBalances ?? [],
    tasks: query.data?.tasks ?? [],
    notifications: query.data?.notifications ?? [],
    events: query.data?.events ?? [],
    quickActions: query.data?.quickActions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}