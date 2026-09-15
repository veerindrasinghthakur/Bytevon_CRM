import { Link } from '@tanstack/react-router'
import { workforceRoutes } from '../../routes'
import { Icon } from './employee-detail-utils'

type Props = {
  employmentId: number
}

export function EmployeeQuickLinks({ employmentId }: Props) {
  return (
    <aside className="xl:col-span-3 space-y-4">
      <div className="bv-surface p-5 space-y-3">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Icon name="account_balance" className="text-lg" />
          <p className="text-label-md font-semibold uppercase tracking-wide">Quick links</p>
        </div>

        <Link
          to={workforceRoutes.employeeBankDetails(employmentId)}
          className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm font-medium text-on-surface hover:border-secondary/60 hover:text-secondary transition-colors"
        >
          <span className="flex items-center gap-2">
            <Icon name="account_balance_wallet" className="text-base" />
            Bank details
          </span>
          <Icon name="chevron_right" className="text-base" />
        </Link>
      </div>
    </aside>
  )
}
