import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listDepartments } from '../api/departments'
import { computeDepartmentListMetrics } from '@/shared/compute/workforce-metrics'

export const DEPARTMENTS_LIST_KEY = ['workforce', 'departments', 'list'] as const

export function useDepartmentsList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, { includeArchived: true }],
    queryFn: () => listDepartments({ includeArchived: true }),
  })

  const items = data?.items ?? []

  const metrics = useMemo(() => computeDepartmentListMetrics(items), [items])

  const filtered = useMemo(() => {
    return items.filter((d) => {
      const q = search.toLowerCase()
      const matchQ =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.headName.toLowerCase().includes(q)
      const matchS = status === 'All' || d.status === status
      return matchQ && matchS
    })
  }, [items, search, status])

  const filtersActive = Boolean(search) || status !== 'All'

  const resetFilters = useCallback(() => {
    setSearch('')
    setStatus('All')
  }, [])

  return {
    items,
    filtered,
    metrics,
    loading: isLoading,
    error: isError,
    isFetching,
    search,
    setSearch,
    status,
    setStatus,
    filtersActive,
    resetFilters,
    reload: () => void refetch(),
    refetch,
  }
}
