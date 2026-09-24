import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { formatMoney, structureGross } from '@/shared/mock/data/payroll'
import { getEmployeeDetail } from '@/modules/workforce/api/employment'
import { getPayrollEmployee } from '../../api/monthly'
import { fallbackEmployeeRow } from '../../api/_helpers'
import { getSalaryStructure, listSalaryVersions } from '../../api/salary'

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
  const versionsQuery = useQuery({
    queryKey: ['payroll', 'salary-versions', id],
    queryFn: () => listSalaryVersions(id),
    enabled: Boolean(id),
  })
  // Fresh/future-dated first version: no monthly rows yet → workforce header.
  const detailQuery = useQuery({
    queryKey: ['workforce', 'employment', 'detail', id],
    queryFn: () => getEmployeeDetail(Number(id)),
    enabled: Boolean(id) && Number.isFinite(Number(id)) && empQuery.data === null,
  })

  const structure = structureQuery.data
  const gross = structure ? structureGross(structure) : empQuery.data?.gross ?? 0
  const emp = empQuery.data ?? fallbackEmployeeRow(detailQuery.data, id)

  return {
    employeeId: id,
    emp,
    structure,
    versions: versionsQuery.data ?? [],
    gross,
    formatMoney,
    isLoading: empQuery.isLoading || structureQuery.isLoading || detailQuery.isLoading,
    detailError: empQuery.error ?? null,
  }
}
