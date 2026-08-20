import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { payrollEmployees, formatMoney } from '../data/mock'

export function usePayrollReview() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const emp = payrollEmployees.find((e) => e.id === employeeId) ?? payrollEmployees[0]
  const [showPayModal, setShowPayModal] = useState(false)

  const gross = 8500
  const totalEarnings = 9250
  const totalDeductions = 1845
  const netAdj = 125
  const netPayable = 7530

  const attendanceSummary: [string, string][] = [
    ['Working Days', '22'],
    ['Present Days', '20'],
    ['Paid Leave', '2'],
    ['LOP Days', '0'],
    ['Working Hours', '176h'],
    ['Overtime Hours', '12h'],
  ]

  const earnings: [string, number][] = [
    ['Basic Salary', 5000],
    ['House Rent Allowance (HRA)', 2000],
    ['Conveyance Allowance', 800],
    ['Special Allowance', 700],
    ['Overtime Pay', 750],
  ]

  const deductions: [string, number][] = [
    ['Provident Fund (PF)', 450],
    ['Tax Deducted at Source (TDS)', 1350],
    ['Professional Tax', 45],
  ]

  return {
    emp,
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
  }
}
