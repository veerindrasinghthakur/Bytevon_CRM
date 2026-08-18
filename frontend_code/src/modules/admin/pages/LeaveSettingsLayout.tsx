import { Outlet } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { LeaveSettingsNav } from '../components/LeaveSettingsNav'

/** Layout for /admin/leave-settings/* — types, policies, ledger */
export function LeaveSettingsLayout() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Settings"
        description="Leave types, entitlements, policies, and employee leave ledgers."
      />
      <LeaveSettingsNav />
      <div className="min-w-0 w-full">
        <Outlet />
      </div>
    </div>
  )
}
