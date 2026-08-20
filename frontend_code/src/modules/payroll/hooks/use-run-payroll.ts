import { payrollEmployees, formatMoney } from '../data/mock'

const checks = [
  {
    ok: true,
    title: 'Employee salary configuration available',
    detail: 'All active employees have a base salary set.',
  },
  {
    ok: true,
    title: 'Monthly attendance summary available',
    detail: 'Timesheets are available for processing.',
  },
  {
    ok: true,
    title: 'No existing payroll for this month',
    detail: 'Selected period is clear to generate.',
  },
  {
    ok: true,
    title: 'Period ready',
    detail: 'You can generate payroll for the selected month.',
  },
]

const previewMetrics = [
  { label: 'Total Employees', value: '42' },
  { label: 'Gross Salary', value: '$245,600' },
  { label: 'Total Additions', value: '+$12,400', valueClass: 'text-success-emerald' },
  { label: 'Total Deductions', value: '-$45,200', valueClass: 'text-error' },
]

export function useRunPayroll() {
  const previewRows = payrollEmployees.slice(0, 4)

  return {
    checks,
    previewMetrics,
    previewRows,
    estimatedNet: '$212,800.00',
    employeeCount: 42,
    formatMoney,
  }
}
