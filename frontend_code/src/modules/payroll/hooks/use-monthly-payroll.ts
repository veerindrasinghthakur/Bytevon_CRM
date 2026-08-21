import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listPayrollEmployees } from '../api/payroll'
import { formatMoney } from '../data/mock'

export function useMonthlyPayroll() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const query = useQuery({
    queryKey: ['payroll', 'employees', search, statusFilter],
    queryFn: () =>
      listPayrollEmployees({
        search: search || undefined,
        status: statusFilter,
      }),
  })

  const filtered = query.data ?? []

  const totals = useMemo(() => {
    const gross = filtered.reduce((s, e) => s + e.gross, 0)
    const net = filtered.reduce((s, e) => s + e.net, 0)
    const earnings = filtered.reduce((s, e) => s + e.earnings, 0)
    const deductions = filtered.reduce((s, e) => s + e.deductions, 0)
    return { gross, net, earnings, deductions, count: filtered.length }
  }, [filtered])

  return {
    filtered,
    totals,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    formatMoney,
    allCount: filtered.length,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
