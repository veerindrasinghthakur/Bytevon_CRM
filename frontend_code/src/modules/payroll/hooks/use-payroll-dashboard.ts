import { useQuery } from '@tanstack/react-query'
import {
  getPayrollKpis,
  getPayrollPeriodMeta,
  listPayrollActivity,
  listPayrollEmployees,
} from '../api/payroll'
import { formatMoney, formatMoneyShort } from '../data/mock'

export function usePayrollDashboard() {
  const kpisQuery = useQuery({
    queryKey: ['payroll', 'kpis'],
    queryFn: getPayrollKpis,
  })
  const periodQuery = useQuery({
    queryKey: ['payroll', 'period'],
    queryFn: getPayrollPeriodMeta,
  })
  const activityQuery = useQuery({
    queryKey: ['payroll', 'activity'],
    queryFn: listPayrollActivity,
  })
  const employeesQuery = useQuery({
    queryKey: ['payroll', 'employees', 'dashboard'],
    queryFn: () => listPayrollEmployees(),
  })

  return {
    kpis: kpisQuery.data,
    period: periodQuery.data,
    activity: activityQuery.data ?? [],
    employees: employeesQuery.data ?? [],
    formatMoney,
    formatMoneyShort,
    isLoading:
      kpisQuery.isLoading ||
      periodQuery.isLoading ||
      activityQuery.isLoading ||
      employeesQuery.isLoading,
  }
}
