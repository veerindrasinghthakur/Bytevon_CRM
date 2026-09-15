import { useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { formatMoney } from '@/shared/mock/data/payroll'
import type { SaveSalaryStructureInput } from '../../types'
import { getPayrollEmployee } from '../../api/monthly'
import { getSalaryStructure, saveSalaryStructure } from '../../api/salary'

export function useReviseSalary() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''
  const qc = useQueryClient()

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

  const saveMut = useMutation({
    mutationFn: (input: SaveSalaryStructureInput) => saveSalaryStructure(id, input),
    onSuccess: (saved) => {
      qc.setQueryData(queryKeys.payroll.salary(id), saved)
      invalidate.payrollEmployees(qc)
    },
  })

  return {
    emp: empQuery.data ?? null,
    structure: structureQuery.data ?? null,
    formatMoney,
    saveMut,
    isLoading: empQuery.isLoading || structureQuery.isLoading,
  }
}
