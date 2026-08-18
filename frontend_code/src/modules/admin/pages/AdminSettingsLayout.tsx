import { Outlet } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { AdminSettingsNav } from '../components/AdminSettingsNav'

/**
 * Shared shell for all /admin/settings/* pages:
 * vertical settings nav + content outlet.
 */
export function AdminSettingsLayout() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration Settings"
        description="Organization identity, offices, shifts, holidays, and regional policies."
      />
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <AdminSettingsNav />
        <div className="flex-1 min-w-0 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
