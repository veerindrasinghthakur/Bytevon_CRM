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

  const listFilters = {
    search: controls.debouncedSearch || undefined,
    department: controls.filters.dept !== 'all' ? controls.filters.dept : undefined,
    state: controls.filters.state !== 'all' ? controls.filters.state : undefined,
    type: controls.filters.type !== 'all' ? controls.filters.type : undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const employeesQuery = useQuery({
    queryKey: queryKeys.workforce.employees.list(listFilters),
    queryFn: () =>
      listEmployments({
        search: listFilters.search,
        department: listFilters.department,
        state: listFilters.state,
        type: listFilters.type,
        page: listFilters.page,
        pageSize: listFilters.pageSize,
      }),
  })

  const departmentsQuery = useQuery({
    queryKey: queryKeys.workforce.departments.list({ includeArchived: false }),
    queryFn: () => listDepartments({ includeArchived: false }),
  })

  const items = employeesQuery.data?.items ?? []
  const departments = useMemo(
    () => (departmentsQuery.data?.items ?? []).map((d) => ({ id: d.id, name: d.name })),
    [departmentsQuery.data],
  )

  const metrics = useMemo(() => computeEmploymentListMetrics(items), [items])

  return {
    items,
    metrics,
    departments,
    states: [...EMPLOYMENT_STATES],
    types: [...EMPLOYMENT_TYPES],
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
    setPageSize: controls.setPageSize,
    reload: () => void employeesQuery.refetch(),
    refetch: employeesQuery.refetch,
  }
}