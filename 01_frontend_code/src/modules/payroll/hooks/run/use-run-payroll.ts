import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { formatMoney } from '@/shared/mock/data/payroll'
import { getRunPayrollChecks, getRunPayrollPreview, runPayroll } from '../../api/run'

export function useRunPayroll() {
  const qc = useQueryClient()
  const checksQuery = useQuery({
    queryKey: queryKeys.payroll.runChecks(),
    queryFn: getRunPayrollChecks,
  })
  const previewQuery = useQuery({
    queryKey: queryKeys.payroll.runPreview(),
    queryFn: getRunPayrollPreview,
  })
  const runMut = useMutation({
    mutationFn: (period: { year: number; month: number }) => runPayroll(period),
    onSuccess: () => {
      invalidate.payroll(qc)
      void qc.invalidateQueries({ queryKey: queryKeys.payroll.runPreview() })
      void qc.invalidateQueries({ queryKey: queryKeys.payroll.runChecks() })
    },
  })

  const preview = previewQuery.data
  const previewMetrics = preview
    ? [
        { label: 'Total Employees', value: String(preview.employees.length) },
        { label: 'Gross Salary', value: formatMoney(preview.totalGross) },
        {
          label: 'Total Additions',
          value: `+${formatMoney(preview.totalEarnings)}`,
          valueClass: 'text-secondary',
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
    runMut,
    isRunning: runMut.isPending,
  }
}
