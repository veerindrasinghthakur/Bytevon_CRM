import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMyTasks } from '../api/my-work'

export function useMyTasks() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const query = useQuery({
    queryKey: ['my-work', 'tasks', search, statusFilter],
    queryFn: () =>
      listMyTasks({
        search: search || undefined,
        status: statusFilter,
      }),
  })

  return {
    tasks: query.data ?? [],
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
