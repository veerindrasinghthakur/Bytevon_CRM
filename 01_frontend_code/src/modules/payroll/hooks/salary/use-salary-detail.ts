import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { formatMoney, structureGross } from '@/shared/mock/data/payroll'
import { getPayrollEmployee } from '../../api/monthly'
import { getSalaryStructure } from '../../api/salary'

export function useSalaryDetail() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''

  const empQuery = useQuery({
    queryKey: queryKeys.payroll.employees.detail(id),
    queryFn: () => getPayrollEmployee(id),
    enabled: Boolean(id),
  })
  const structureQuery = useQuery({
    queryKey: queryKeys.payroll.salary(id),
    queryFn: () => getSalaryStructure(id),
    enabled: Boolean(id),
  })

  const structure = structureQuery.data
  const gross = structure ? structureGross(structure) : empQuery.data?.gross ?? 0

  return {
    emp: empQuery.data ?? null,
    structure,
    gross,
    formatMoney,
    isLoading: empQuery.isLoading || structureQuery.isLoading,
    detailError: empQuery.error ?? null,
  }
}
