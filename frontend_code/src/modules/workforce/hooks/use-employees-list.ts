import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { listEmployments } from '../api/employment'
import { listDepartments } from '../api/departments'
import { queryKeys } from '@/shared/lib/query-keys'
import { computeEmploymentListMetrics } from '@/shared/compute/workforce-metrics'

const FILTER_DEFAULTS = {
  dept: 'all',
  state: 'all',
  type: 'all',
}

export function useEmployeesList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
  })

  const employeesQuery = useQuery({
    queryKey: queryKeys.workforce.employees.list({}),
    queryFn: () => listEmployments({}),
  })

  const departmentsQuery = useQuery({
    queryKey: queryKeys.workforce.departments.list({ includeArchived: false }),
    queryFn: () => listDepartments({}),
  })

  const items = employeesQuery.data?.items ?? []
  const departments = useMemo(
    () => (departmentsQuery.data?.items ?? []).map((d) => ({ id: d.id, name: d.name })),
    [departmentsQuery.data],
  )

  const metrics = useMemo(() => computeEmploymentListMetrics(items), [items])

  const filtered = useMemo(() => {
    const q = controls.debouncedSearch.toLowerCase().trim()
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
      if (controls.filters.dept !== 'all' && e.departmentName !== controls.filters.dept) return false
      if (controls.filters.state !== 'all' && e.current_state !== controls.filters.state) return false
      if (controls.filters.type !== 'all' && e.employment_type !== controls.filters.type) return false
      return true
    })
  }, [items, controls.debouncedSearch, controls.filters.dept, controls.filters.state, controls.filters.type])

  const states = useMemo(
    () => Array.from(new Set(items.map((e) => e.current_state))).sort(),
    [items],
  )
  const types = useMemo(
    () => Array.from(new Set(items.map((e) => e.employment_type))).sort(),
    [items],
  )

  const pageItems = useMemo(() => controls.pageItems(filtered), [controls, filtered])

  return {
    items,
    filtered,
    metrics,
    departments,
    states,
    types,
    loading: employeesQuery.isLoading,
    isLoading: employeesQuery.isLoading,
    error: employeesQuery.isError,
    isError: employeesQuery.isError,
    isFetching: employeesQuery.isFetching,
    search: controls.search,
    setSearch: controls.setSearch,
    deptFilter: controls.filters.dept,
    setDeptFilter: (v: string) => controls.setFilter('dept', v),
    stateFilter: controls.filters.state,
    setStateFilter: (v: string) => controls.setFilter('state', v),
    typeFilter: controls.filters.type,
    setTypeFilter: (v: string) => controls.setFilter('type', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    pageItems,
    reload: () => void employeesQuery.refetch(),
    refetch: employeesQuery.refetch,
  }
}
