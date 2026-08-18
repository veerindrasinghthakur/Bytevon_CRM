import { Outlet } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { AttendanceSettingsNav } from '../components/AttendanceSettingsNav'

/** Layout for /admin/attendance-settings/* */
export function AttendanceSettingsLayout() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Settings"
        description="Organization-wide attendance policies, working hours, and check-in rules."
      />
      <AttendanceSettingsNav />
      <div className="min-w-0 w-full">
        <Outlet />
      </div>
    </div>
  )
}
