import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  getPayrollEmployee,
  getSalaryStructure,
  listEmployeePayrollHistory,
} from '../api/payroll'
import { formatMoney, structureGross } from '../data/mock'

export function useEmployeePayrollHistory() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''

  const empQuery = useQuery({
    queryKey: ['payroll', 'employee', id],
    queryFn: () => getPayrollEmployee(id),
    enabled: Boolean(id),
  })
  const historyQuery = useQuery({
    queryKey: ['payroll', 'history', id],
    queryFn: () => listEmployeePayrollHistory(id),
    enabled: Boolean(id),
  })
  const structureQuery = useQuery({
    queryKey: ['payroll', 'salary', id],
    queryFn: () => getSalaryStructure(id),
    enabled: Boolean(id),
  })

  const historyRows = historyQuery.data ?? []
  const ytdNet = historyRows.filter((r) => r.year === 2026).reduce((s, r) => s + r.net, 0)
  const currentGross = structureQuery.data
    ? structureGross(structureQuery.data)
    : empQuery.data?.gross ?? 0
  const avgNet =
    historyRows.length > 0
      ? Math.round(historyRows.reduce((s, r) => s + r.net, 0) / historyRows.length)
      : 0

  const summaryCards = [
    {
      id: 'gross',
      label: 'Current Gross Salary',
      icon: 'payments',
      value: formatMoney(currentGross),
      subtitle: 'Per pay period',
    },
    {
      id: 'net',
      label: 'Average Net (history)',
      icon: 'account_balance_wallet',
      value: formatMoney(avgNet),
      subtitle: 'From paid periods',
    },
    {
      id: 'ytd',
      label: 'Total Paid This Year (YTD)',
      icon: 'insights',
      value: formatMoney(ytdNet),
      subtitle: 'YTD 2026',
    },
  ]

  return {
    emp: empQuery.data,
    historyRows,
    summaryCards,
    totalResults: historyRows.length,
    pageSize: historyRows.length,
    formatMoney,
    isLoading: empQuery.isLoading || historyQuery.isLoading,
  }
}
