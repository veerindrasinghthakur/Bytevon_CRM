import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getPayrollEmployee } from '../api/payroll'
import { formatMoney } from '../data/mock'

export function usePayrollReview() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const [showPayModal, setShowPayModal] = useState(false)

  const query = useQuery({
    queryKey: ['payroll', 'employee', employeeId],
    queryFn: () => getPayrollEmployee(employeeId ?? ''),
    enabled: Boolean(employeeId),
  })

  const emp = query.data

  const gross = emp?.gross ?? 8500
  const totalEarnings = emp ? emp.gross + emp.earnings : 9250
  const totalDeductions = emp?.deductions ?? 1845
  const netAdj = 125
  const netPayable = emp?.net ?? 7530

  const attendanceSummary: [string, string][] = [
    ['Working Days', '22'],
    ['Present Days', '20'],
    ['Paid Leave', '2'],
    ['LOP Days', '0'],
    ['Working Hours', '176h'],
    ['Overtime Hours', '12h'],
  ]

  const earnings: [string, number][] = [
    ['Basic Salary', Math.round(gross * 0.59)],
    ['House Rent Allowance (HRA)', Math.round(gross * 0.24)],
    ['Conveyance Allowance', 800],
    ['Special Allowance', 700],
    ['Overtime Pay', emp?.earnings ?? 750],
  ]

  const deductions: [string, number][] = [
    ['Provident Fund (PF)', 450],
    ['Tax Deducted at Source (TDS)', Math.max(0, totalDeductions - 495)],
    ['Professional Tax', 45],
  ]

  return {
    emp: emp ?? {
      id: employeeId ?? 'e1',
      name: '—',
      code: '—',
      role: '—',
      department: '—',
      initials: '—',
      gross,
      earnings: 0,
      deductions: totalDeductions,
      net: netPayable,
      status: 'Calculated' as const,
    },
    showPayModal,
    setShowPayModal,
    gross,
    totalEarnings,
    totalDeductions,
    netAdj,
    netPayable,
    attendanceSummary,
    earnings,
    deductions,
    formatMoney,
    periodLabel: 'August 2026',
    isLoading: query.isLoading,
  }
}
