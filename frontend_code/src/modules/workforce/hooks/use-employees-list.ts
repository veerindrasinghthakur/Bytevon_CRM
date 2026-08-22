import { useCallback, useEffect, useMemo, useState } from 'react'
import { listEmployments, type EmploymentListItem } from '../api/employment'
import { listDepartments } from '../api/departments'
import { computeEmploymentListMetrics } from '@/shared/compute/workforce-metrics'

export function useEmployeesList() {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [items, setItems] = useState<EmploymentListItem[]>([])
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [res, depts] = await Promise.all([listEmployments({}), listDepartments({})])
      setItems(res.items)
      setDepartments(depts.items.map((d) => ({ id: d.id, name: d.name })))
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

  const metrics = useMemo(() => computeEmploymentListMetrics(items), [items])

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
    error,
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
    reload: load,
  }
}
