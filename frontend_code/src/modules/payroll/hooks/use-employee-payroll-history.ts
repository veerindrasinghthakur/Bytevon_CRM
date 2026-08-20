import { useParams } from '@tanstack/react-router'
import { payrollEmployees } from '../data/mock'

/** Immutable paid-out payroll history only — no mutable / in-progress rows. */
const historyRows = [
  {
    month: 'November 2023',
    gross: '$8,500.00',
    earnings: '+$500.00',
    deductions: '-$1,250.00',
    adjustments: '$0.00',
    net: '$7,750.00',
    paymentDate: 'Pending',
    status: 'APPROVED' as const,
  },
  {
    month: 'October 2023',
    gross: '$8,500.00',
    earnings: '+$500.00',
    deductions: '-$1,250.00',
    adjustments: '$0.00',
    net: '$7,750.00',
    paymentDate: 'Oct 30, 2023',
    status: 'PAID' as const,
  },
  {
    month: 'September 2023',
    gross: '$8,500.00',
    earnings: '+$200.00',
    deductions: '-$1,250.00',
    adjustments: '-$100.00',
    net: '$7,350.00',
    paymentDate: 'Sep 28, 2023',
    status: 'PAID' as const,
  },
  {
    month: 'August 2023',
    gross: '$8,500.00',
    earnings: '+$500.00',
    deductions: '-$1,250.00',
    adjustments: '$0.00',
    net: '$7,750.00',
    paymentDate: 'Aug 30, 2023',
    status: 'PAID' as const,
  },
]

const summaryCards = [
  {
    id: 'gross',
    label: 'Current Gross Salary',
    icon: 'payments',
    value: '$8,500.00',
    subtitle: 'Per pay period',
  },
  {
    id: 'net',
    label: 'Current Net Salary',
    icon: 'account_balance_wallet',
    value: '$6,450.00',
    subtitle: 'Estimated average',
  },
  {
    id: 'ytd',
    label: 'Total Paid This Year (YTD)',
    icon: 'insights',
    value: '$64,500.00',
    subtitle: 'As of Nov 2023',
    change: '+12%',
  },
] as const

export function useEmployeePayrollHistory() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const emp = payrollEmployees.find((e) => e.id === employeeId) ?? payrollEmployees[0]

  return {
    emp,
    historyRows,
    summaryCards,
    totalResults: 24,
    pageSize: historyRows.length,
  }
}
