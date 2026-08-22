import { useQuery } from '@tanstack/react-query'
import { getRunPayrollChecks, getRunPayrollPreview } from '../api/payroll'
import { formatMoney } from '../data/mock'

export function useRunPayroll() {
  const checksQuery = useQuery({
    queryKey: ['payroll', 'run-checks'],
    queryFn: getRunPayrollChecks,
  })
  const previewQuery = useQuery({
    queryKey: ['payroll', 'run-preview'],
    queryFn: getRunPayrollPreview,
  })

  const preview = previewQuery.data
  const previewMetrics = preview
    ? [
        { label: 'Total Employees', value: String(preview.employees.length) },
        { label: 'Gross Salary', value: formatMoney(preview.totalGross) },
        {
          label: 'Total Additions',
          value: `+${formatMoney(preview.totalEarnings)}`,
          valueClass: 'text-success-emerald',
        },
        {
          label: 'Total Deductions',
          value: `-${formatMoney(preview.totalDeductions)}`,
          valueClass: 'text-error',
        },
      ]
    : []

  return {
    checks: checksQuery.data ?? [],
    previewMetrics,
    previewRows: (preview?.employees ?? []).slice(0, 4),
    estimatedNet: preview ? formatMoney(preview.estimatedNet) : formatMoney(0),
    employeeCount: preview?.employees.length ?? 0,
    formatMoney,
    isLoading: checksQuery.isLoading || previewQuery.isLoading,
  }
}
