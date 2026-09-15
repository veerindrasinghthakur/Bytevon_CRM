import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { formatMoney } from '@/shared/mock/data/payroll'
import { getPayslip } from '../../api/payslip'

export function usePayslip() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''

  const query = useQuery({
    queryKey: queryKeys.payroll.payslip(id),
    queryFn: () => getPayslip(id),
    enabled: Boolean(id),
  })

  return {
    payslip: query.data ?? null,
    emp: query.data?.employee ?? null,
    formatMoney,
    isLoading: query.isLoading,
    isError: query.isError || (!query.isLoading && !query.data),
  }
}
