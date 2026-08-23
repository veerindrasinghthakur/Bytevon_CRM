import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listEmployments } from '../api/employment'
import { listDepartments } from '../api/departments'
import { computeEmploymentListMetrics } from '@/shared/compute/workforce-metrics'
import { DEPARTMENTS_LIST_KEY } from './use-departments-list'

/** Shared query key — also invalidated by department mutations */
export const EMPLOYEES_LIST_KEY = ['workforce', 'employees', 'list'] as const

export function useEmployeesList() {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const employeesQuery = useQuery({
    queryKey: [...EMPLOYEES_LIST_KEY],
    queryFn: () => listEmployments({}),
  })

  // Reuse the same departments list cache as Departments pages
  const departmentsQuery = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, { includeArchived: false }],
    queryFn: () => listDepartments({}),
  })

  const items = employeesQuery.data?.items ?? []
  const departments = useMemo(
    () => (departmentsQuery.data?.items ?? []).map((d) => ({ id: d.id, name: d.name })),
    [departmentsQuery.data],
  )

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
    loading: employeesQuery.isLoading,
    error: employeesQuery.isError,
    isFetching: employeesQuery.isFetching,
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
    reload: () => void employeesQuery.refetch(),
    refetch: employeesQuery.refetch,
  }
}
