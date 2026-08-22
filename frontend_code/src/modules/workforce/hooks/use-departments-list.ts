import { useCallback, useEffect, useMemo, useState } from 'react'
import { listDepartments, type DepartmentListItem } from '../api/departments'
import { computeDepartmentListMetrics } from '@/shared/compute/workforce-metrics'

export function useDepartmentsList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [items, setItems] = useState<DepartmentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await listDepartments({ includeArchived: true })
      setItems(res.items)
    } catch {
      setError(true)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    filtersActive,
    resetFilters,
    reload: load,
  }
}
