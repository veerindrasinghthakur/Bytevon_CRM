import { Outlet } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { AdminSettingsNav } from '../components/AdminSettingsNav'
import { AdminErrorBoundary } from '../components/AdminErrorBoundary'
import { getAdminHubMetrics } from '../api/metrics'
import { queryKeys } from '@/shared/lib/query-keys'

/**
 * Shared shell for /admin/settings/* — horizontal nav + content.
 * Metric cards derived from live org/workforce list APIs (see getAdminHubMetrics).
 */
export function AdminSettingsLayout() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: [...queryKeys.admin.metrics.all, 'hub'] as const,
    queryFn: getAdminHubMetrics,
    staleTime: 30_000,
  })

  const display = (n: number | undefined) =>
    isLoading && n == null ? '…' : String(n ?? '—')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration Settings"
        description="Organization identity, offices, shifts, holidays, and regional policies."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="apartment"
          label="Offices / Locations"
          value={display(metrics?.offices)}
          hint="Active sites"
        />
        <MetricCard
          icon="schedule"
          label="Shifts"
          value={display(metrics?.shifts)}
          hint="Active schedules"
        />
        <MetricCard
          icon="account_tree"
          label="Departments"
          value={display(metrics?.departments)}
          hint="Org structure"
        />
        <MetricCard
          icon="groups"
          label="Employees"
          value={display(metrics?.employees)}
          hint="Active employments"
        />
      </section>

      <AdminSettingsNav />
      <div className="min-w-0 w-full">
        <AdminErrorBoundary label="Settings">
          <Outlet />
        </AdminErrorBoundary>
      </div>
    </div>
  )
}
