import { useCallback, useEffect, useMemo, useState } from 'react'
import { listDepartments, type DepartmentListItem } from '../api/departments'

export function useDepartmentsList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [items, setItems] = useState<DepartmentListItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await listDepartments({ includeArchived: true })
    setItems(res.items)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const metrics = useMemo(() => {
    const total = items.length
    const active = items.filter((d) => d.status === 'Active').length
    const inactive = items.filter((d) => d.status !== 'Active').length
    const staffing = items.reduce((sum, d) => sum + (d.staffCount ?? 0), 0)
    return { total, active, inactive, staffing }
  }, [items])

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
    search,
    setSearch,
    status,
    setStatus,
    filtersActive,
    resetFilters,
    reload: load,
  }
}
