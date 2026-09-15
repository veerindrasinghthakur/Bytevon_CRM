import { useState } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { LeaveSettingsNav } from '../../components/settings/LeaveSettingsNav'
import { LeaveEditContext } from '../../context/LeaveEditContext'
import { AdminErrorBoundary } from '../../components/AdminErrorBoundary'
import { getLeaveAdminMetrics } from '../../api/attendance'
import { queryKeys } from '@/shared/lib/query-keys'

/** Layout for /admin/leave-settings/* — metrics above nav; Edit pencil moved to Accrual Policy section */
export function LeaveSettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [editing, setEditing] = useState(false)
  const isPolicies = pathname.includes('/policies') || pathname.includes('/ledger')

  const { data: metrics } = useQuery({
    queryKey: queryKeys.admin.leave.policies(),
    queryFn: getLeaveAdminMetrics,
  })

  return (
    <LeaveEditContext.Provider value={{ editing: isPolicies ? false : editing, setEditing }}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <PageHeader
            title="Leave Settings"
            description="Leave types, entitlements, policies, and employee leave ledgers."
          />
          {!isPolicies && editing && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Discard
              </Button>
              <Button variant="primary" size="sm" onClick={() => setEditing(false)}>
                Save
              </Button>
            </div>
          )}
        </div>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon="event_available"
            label="Leave Types"
            value={String(metrics?.leaveTypes ?? '—')}
            hint="Configured"
          />
          <MetricCard
            icon="hourglass_top"
            label="Pending Requests"
            value={String(metrics?.pendingRequests ?? '—')}
            hint="Awaiting approval"
            valueClassName="text-error"
          />
          <MetricCard
            icon="check_circle"
            label="Approved (Month)"
            value={String(metrics?.approvedThisMonth ?? '—')}
            hint="This month"
          />
          <MetricCard
            icon="balance"
            label="Avg Balance"
            value={metrics ? `${metrics.avgBalanceDays}d` : '—'}
            hint="Per employee"
          />
        </section>

        <LeaveSettingsNav />
        <div className="min-w-0 w-full">
          <AdminErrorBoundary label="Leave settings">
            <Outlet />
          </AdminErrorBoundary>
        </div>
      </div>
    </LeaveEditContext.Provider>
  )
}
