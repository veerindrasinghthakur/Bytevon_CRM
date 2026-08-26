import { Outlet } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { AdminSettingsNav } from '../components/AdminSettingsNav'
import { getAdminHubMetrics } from '../api/metrics'

/**
 * Shared shell for /admin/settings/* — horizontal nav + content.
 * Top metric cards (offices, departments, employees) appended; layout otherwise unchanged.
 */
export function AdminSettingsLayout() {
  const { data: metrics } = useQuery({
    queryKey: ['admin', 'metrics', 'hub'],
    queryFn: getAdminHubMetrics,
  })

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
          value={String(metrics?.offices ?? '—')}
          hint="Active sites"
        />
        <MetricCard
          icon="schedule"
          label="Shifts"
          value={String(metrics?.shifts ?? '—')}
          hint="Active schedules"
        />
        <MetricCard
          icon="account_tree"
          label="Departments"
          value={String(metrics?.departments ?? '—')}
          hint="Org structure"
        />
        <MetricCard
          icon="groups"
          label="Employees"
          value={String(metrics?.employees ?? '—')}
          hint="Active employments"
        />
      </section>

      <AdminSettingsNav />
      <div className="min-w-0 w-full">
        <Outlet />
      </div>
    </div>
  )
}
