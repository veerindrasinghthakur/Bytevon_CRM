import { Link } from '@tanstack/react-router'
import type { EmployeeDetailDto } from '@/shared/schema'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { payrollRoutes } from '@/modules/payroll/routes'
import { formatMoney } from './employee-detail-utils'

type Props = {
  data: EmployeeDetailDto
  employmentId: number
}

export function EmployeeSalaryTab({ data, employmentId }: Props) {
  return (
    <div className="space-y-3">
      {data.currentSalary ? (
        <p className="text-title-lg font-semibold">
          Gross: {formatMoney(Number(data.currentSalary.gross_salary ?? 0))}
        </p>
      ) : (
        <p className="text-body-sm text-on-surface-variant">No active salary structure.</p>
      )}
      <Link
        {...looseLinkProps({
          to: payrollRoutes.historyEmployeePath,
          params: { employeeId: String(employmentId) },
          className: 'text-secondary text-sm font-medium hover:underline',
        })}
      >
        Open payroll history
      </Link>
    </div>
  )
}
