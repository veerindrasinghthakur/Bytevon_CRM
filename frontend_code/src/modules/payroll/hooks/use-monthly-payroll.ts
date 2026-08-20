import { useMemo, useState } from 'react'
import { payrollEmployees, formatMoney } from '../data/mock'

export function useMonthlyPayroll() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return payrollEmployees.filter((e) => {
      const matchQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || e.status === statusFilter
      return matchQ && matchStatus
    })
  }, [search, statusFilter])

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
    allCount: payrollEmployees.length,
  }
}
