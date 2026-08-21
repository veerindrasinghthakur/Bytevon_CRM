import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMyAttendance } from '../api/my-work'

export function useMyAttendance() {
  const [search, setSearch] = useState('')

  const query = useQuery({
    queryKey: ['my-work', 'attendance', search],
    queryFn: () => listMyAttendance({ search: search || undefined }),
  })

  return {
    records: query.data ?? [],
    search,
    setSearch,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
