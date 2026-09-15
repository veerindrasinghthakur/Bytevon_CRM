import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { useListControls } from '@/shared/hooks/useListControls'
import { formatMoney } from '@/shared/mock/data/payroll'
import { listPayrollEmployees } from '../../api/monthly'

export function useSalaryList() {
  const controls = useListControls({
    filterDefaults: {},
    pagination: { pageSize: 20 },
  })
  const params = {
    search: controls.debouncedSearch.trim() || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const query = useQuery({
    queryKey: queryKeys.payroll.employees.list({ ...params, scope: 'salary' }),
    queryFn: () => listPayrollEmployees(params),
    placeholderData: (prev) => prev,
  })

  return {
    rows: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    search: controls.search,
    setSearch: controls.setSearch,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    formatMoney,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
