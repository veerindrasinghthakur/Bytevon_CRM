import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { formatMoney } from '@/shared/mock/data/payroll'
import { listEmployments } from '@/modules/workforce/api/employment'
import type { SaveSalaryStructureInput } from '../../types'
import { listUnconfiguredEmploymentIds, saveSalaryStructure } from '../../api/salary'

export function useAddSalary() {
  const qc = useQueryClient()
  const [employmentId, setEmploymentId] = useState('')

  const unconfiguredQuery = useQuery({
    queryKey: ['payroll', 'salaries', 'unconfigured'],
    queryFn: listUnconfiguredEmploymentIds,
  })
  const workforceQuery = useQuery({
    queryKey: ['workforce', 'employments', { page: 1, pageSize: 500 }],
    queryFn: () => listEmployments({ page: 1, pageSize: 500 }),
  })

  const allowed = useMemo(
    () => new Set(unconfiguredQuery.data ?? []),
    [unconfiguredQuery.data],
  )
  const candidates = useMemo(() => {
    const items =
      (workforceQuery.data as { items?: Array<Record<string, unknown>> } | undefined)
        ?.items ??
      (Array.isArray(workforceQuery.data) ? workforceQuery.data : [])
    return (items as Array<Record<string, unknown>>)
      .map((row) => ({
        id: String(
          (row.employmentId ?? row.employment_id ?? row.id ?? '') as string | number,
        ),
        name: String(
          (row.fullName ?? row.full_name ?? row.name ?? '—') as string,
        ),
        code: String(
          (row.employee_code ?? row.employeeCode ?? row.code ?? '') as string,
        ),
        department: String(
          (row.departmentName ?? row.department_name ?? row.department ?? '—') as string,
        ),
        position: String(
          (row.positionName ?? row.position_name ?? row.position ?? row.role ?? '—') as string,
        ),
      }))
      .filter((c) => c.id && allowed.has(c.id))
  }, [workforceQuery.data, allowed])

  const selected = candidates.find((c) => c.id === employmentId) ?? null

  const saveMut = useMutation({
    mutationFn: (input: SaveSalaryStructureInput) => {
      if (!employmentId) throw new Error('Select an employee first')
      return saveSalaryStructure(employmentId, input)
    },
    onSuccess: () => {
      invalidate.payroll(qc)
      invalidate.payrollEmployees(qc)
      void qc.invalidateQueries({ queryKey: ['payroll', 'salaries', 'unconfigured'] })
    },
  })

  return {
    employmentId,
    setEmploymentId,
    candidates,
    selected,
    formatMoney,
    saveMut,
    isLoading: unconfiguredQuery.isLoading || workforceQuery.isLoading,
    isError: unconfiguredQuery.isError || workforceQuery.isError,
  }
}
