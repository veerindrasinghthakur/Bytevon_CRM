import { useCallback, useEffect, useMemo, useState } from 'react'
import { listEmployments, type EmploymentListItem } from '../api/employment'
import { listDepartments } from '../api/departments'

export function useEmployeesList() {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [items, setItems] = useState<EmploymentListItem[]>([])
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [metrics, setMetrics] = useState({ total: 0, active: 0, archived: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [res, depts] = await Promise.all([listEmployments({}), listDepartments({})])
      if (cancelled) return
      setItems(res.items)
      setMetrics(res.metrics)
      setDepartments(depts.items.map((d) => ({ id: d.id, name: d.name })))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter((e) => {
      if (q) {
        const match =
          e.fullName.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q) ||
          e.positionName.toLowerCase().includes(q)
        if (!match) return false
      }
      if (deptFilter !== 'all' && e.departmentName !== deptFilter) return false
      if (stateFilter !== 'all' && e.current_state !== stateFilter) return false
      if (typeFilter !== 'all' && e.employment_type !== typeFilter) return false
      return true
    })
  }, [items, search, deptFilter, stateFilter, typeFilter])

  const states = useMemo(
    () => Array.from(new Set(items.map((e) => e.current_state))).sort(),
    [items],
  )
  const types = useMemo(
    () => Array.from(new Set(items.map((e) => e.employment_type))).sort(),
    [items],
  )

  const filtersActive =
    Boolean(search) || deptFilter !== 'all' || stateFilter !== 'all' || typeFilter !== 'all'

  const resetFilters = useCallback(() => {
    setSearch('')
    setDeptFilter('all')
    setStateFilter('all')
    setTypeFilter('all')
  }, [])

  return {
    items,
    filtered,
    metrics,
    departments,
    states,
    types,
    loading,
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    stateFilter,
    setStateFilter,
    typeFilter,
    setTypeFilter,
    filtersActive,
    resetFilters,
  }
}
