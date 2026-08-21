import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listPendingApprovals } from '../api/approvals'

export function usePendingApprovals() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const query = useQuery({
    queryKey: ['approvals', 'pending', search, typeFilter, priorityFilter],
    queryFn: () =>
      listPendingApprovals({
        search: search || undefined,
        type: typeFilter,
        priority: priorityFilter,
      }),
  })

  const filtered = query.data ?? []

  const types = useMemo(
    () => Array.from(new Set(filtered.map((r) => r.type))).sort(),
    [filtered],
  )

  return {
    items: filtered,
    filtered,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    priorityFilter,
    setPriorityFilter,
    types,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
