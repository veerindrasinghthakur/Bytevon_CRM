import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { useListControls } from '@/shared/hooks/useListControls'
import { formatMoney } from '@/shared/mock/data/payroll'
import { listPayrollEmployees, getMonthlyPayrollSummary } from '../../api/monthly'

export function useMonthlyPayroll() {
  const controls = useListControls({
    filterDefaults: { status: 'All' },
    pagination: { pageSize: 20 },
  })

  const params = {
    search: controls.debouncedSearch.trim() || undefined,
    status: controls.filters.status || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const employeesQuery = useQuery({
    queryKey: queryKeys.payroll.employees.list(params),
    queryFn: () => listPayrollEmployees(params),
    placeholderData: (prev) => prev,
  })

  const summaryQuery = useQuery({
    queryKey: queryKeys.payroll.monthlySummary(),
    queryFn: getMonthlyPayrollSummary,
  })

  const filtered = employeesQuery.data?.items ?? []
  const total = employeesQuery.data?.total ?? 0
  const metrics = employeesQuery.data?.metrics ?? summaryQuery.data

  const totals = useMemo(() => {
    const gross = filtered.reduce((s, e) => s + e.gross, 0)
    const net = filtered.reduce((s, e) => s + e.net, 0)
    const earnings = filtered.reduce((s, e) => s + e.earnings, 0)
    const deductions = filtered.reduce((s, e) => s + e.deductions, 0)
    return { gross, net, earnings, deductions, count: filtered.length }
  }, [filtered])

  return {
    filtered,
    total,
    totals,
    summary: metrics,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    formatMoney,
    allCount: total,
    isLoading: employeesQuery.isLoading || summaryQuery.isLoading,
    isError: employeesQuery.isError || summaryQuery.isError,
    error: employeesQuery.error ?? summaryQuery.error,
    refetch: () => {
      void employeesQuery.refetch()
      void summaryQuery.refetch()
    },
  }
}
