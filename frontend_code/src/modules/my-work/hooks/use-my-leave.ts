import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMyLeaveBalances, listMyLeaveRequests } from '../api/my-work'

export function useMyLeave() {
  const [statusFilter, setStatusFilter] = useState('All')

  const requestsQuery = useQuery({
    queryKey: ['my-work', 'leave', statusFilter],
    queryFn: () => listMyLeaveRequests({ status: statusFilter }),
  })

  const balancesQuery = useQuery({
    queryKey: ['my-work', 'leave-balances'],
    queryFn: listMyLeaveBalances,
  })

  return {
    requests: requestsQuery.data ?? [],
    balances: balancesQuery.data ?? [],
    statusFilter,
    setStatusFilter,
    isLoading: requestsQuery.isLoading || balancesQuery.isLoading,
    refetch: () => {
      void requestsQuery.refetch()
      void balancesQuery.refetch()
    },
  }
}
