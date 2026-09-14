import { Outlet } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { AdminErrorBoundary } from '../../components/AdminErrorBoundary'

/** Single-page layout — no sub-nav when only one section */
export function AttendanceSettingsLayout() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Settings"
        description="Organization-wide attendance policies, working hours, and check-in rules."
      />
      <div className="min-w-0 w-full">
        <AdminErrorBoundary label="Attendance settings">
          <Outlet />
        </AdminErrorBoundary>
      </div>
    </div>
  )
}
