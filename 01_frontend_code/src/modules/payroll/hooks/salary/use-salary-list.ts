import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { useListControls } from '@/shared/hooks/useListControls'
import { formatMoney } from '@/shared/mock/data/payroll'
import { listOpenSalaries, listUnconfiguredEmploymentIds } from '../../api/salary'

export function useSalaryList() {
  const controls = useListControls({
    filterDefaults: {},
    pagination: { pageSize: 20 },
  })
  const search = controls.debouncedSearch.trim() || undefined

  const query = useQuery({
    queryKey: [...queryKeys.payroll.employees.all, 'open-salaries', search ?? ''],
    queryFn: () => listOpenSalaries(search),
    placeholderData: (prev) => prev,
  })
  const unconfiguredQuery = useQuery({
    queryKey: ['payroll', 'salaries', 'unconfigured'],
    queryFn: listUnconfiguredEmploymentIds,
    staleTime: 30_000,
  })

  const allRows = query.data ?? []
  const page = controls.page
  const pageSize = controls.pageSize
  const total = allRows.length
  const rows = allRows.slice((page - 1) * pageSize, page * pageSize)
  const grosses = allRows.map((r) => r.gross).filter((g) => g > 0)
  const avgGross = grosses.length
    ? Math.round(grosses.reduce((s, g) => s + g, 0) / grosses.length)
    : 0
  const withoutCount = unconfiguredQuery.data?.length ?? 0

  return {
    rows,
    total,
    search: controls.search,
    setSearch: controls.setSearch,
    page: controls.page,
    setPage: controls.setPage,
    pageSize,
    formatMoney,
    avgGross,
    withCount: total,
    withoutCount,
    totalEmployees: total + withoutCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
