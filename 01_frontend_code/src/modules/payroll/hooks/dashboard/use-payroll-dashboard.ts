import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { formatMoney, formatMoneyShort } from '@/shared/mock/data/payroll'
import { getPayrollKpis, getPayrollPeriodMeta, listPayrollActivity } from '../../api/dashboard'
import { listPayrollEmployees } from '../../api/monthly'

export function usePayrollDashboard() {
  const kpisQuery = useQuery({ queryKey: queryKeys.payroll.kpis(), queryFn: getPayrollKpis })
  const periodQuery = useQuery({
    queryKey: queryKeys.payroll.period(),
    queryFn: getPayrollPeriodMeta,
  })
  const activityQuery = useQuery({
    queryKey: queryKeys.payroll.activity(),
    queryFn: listPayrollActivity,
  })
  const employeesQuery = useQuery({
    queryKey: queryKeys.payroll.employees.list({ scope: 'dashboard', page: 1, pageSize: 20 }),
    queryFn: () => listPayrollEmployees({ page: 1, pageSize: 20 }),
  })

  return {
    kpis: kpisQuery.data,
    period: periodQuery.data,
    activity: activityQuery.data ?? [],
    employees: employeesQuery.data?.items ?? [],
    formatMoney,
    formatMoneyShort,
    isLoading:
      kpisQuery.isLoading ||
      periodQuery.isLoading ||
      activityQuery.isLoading ||
      employeesQuery.isLoading,
  }
}
