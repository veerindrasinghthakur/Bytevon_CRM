import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMyRequests } from '../api/approvals'

export function useMyRequests() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const query = useQuery({
    queryKey: ['approvals', 'my-requests', search, statusFilter],
    queryFn: () =>
      listMyRequests({
        search: search || undefined,
        status: statusFilter,
      }),
  })

  const items = query.data ?? []

  return {
    items,
    filtered: items,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
