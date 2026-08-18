import { Outlet } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { AdminSettingsNav } from '../components/AdminSettingsNav'

/**
 * Shared shell for /admin/settings/* — horizontal (row-wise) nav + content.
 */
export function AdminSettingsLayout() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration Settings"
        description="Organization identity, offices, shifts, holidays, and regional policies."
      />
      <AdminSettingsNav />
      <div className="min-w-0 w-full">
        <Outlet />
      </div>
    </div>
  )
}
