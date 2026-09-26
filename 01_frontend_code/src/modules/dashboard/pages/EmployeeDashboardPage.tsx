import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useEmployeeDashboard } from '../hooks/use-employee-dashboard'
import { useWeekBars } from '../hooks/use-week-bars'
import type { EmployeeMeta } from '../types/dashboard.types'
import { EmployeeHero } from '../components/employee/employee-hero'
import { EmployeeQuickActions } from '../components/employee/employee-quick-actions'
import { EmployeeKpiStrip } from '../components/employee/employee-kpi-strip'
import { EmployeeAttendance } from '../components/employee/employee-attendance'
import { EmployeeLeaveSummary } from '../components/employee/employee-leave-summary'
import { EmployeeTasksTable } from '../components/employee/employee-tasks-table'

export function EmployeeDashboardPage() {
  const navigate = useNavigate()
  const { kpis, tasks, leaveSummary, meta, quickActions, isLoading, isError, error, refetch } =
    useEmployeeDashboard()
  const typedMeta = meta as EmployeeMeta | undefined
  // Monday-first index for the current day (backend weekBars are Mon..Sun).
  const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, [])
  const { weekBarElements } = useWeekBars({ weekBars: typedMeta?.weekBars ?? [], todayIndex })
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  if (isError) {
    return (
      <div className="py-16">
        <ErrorState
          title="Could not load dashboard"
          description={getApiErrorMessage(error, 'We could not load the dashboard data.')}
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  if (isLoading || !meta || !typedMeta) {
    return (
      <div className="py-16 text-center text-body-sm text-on-surface-variant">Loading dashboard…</div>
    )
  }

  const displayName = typedMeta.name ?? 'there'

  return (
    <div className="space-y-8 animate-fade-in">
      <EmployeeHero
        greeting={greeting}
        displayName={displayName}
        employeeId={typedMeta.employeeId}
        department={typedMeta.department}
        todayLabel={typedMeta.todayLabel}
        shift={typedMeta.shift}
      />

      <EmployeeQuickActions
        quickActions={quickActions}
        onNavigate={(to) => safeNavigate(navigate, { to })}
      />

      <EmployeeKpiStrip kpis={kpis} />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EmployeeAttendance
          checkIn={typedMeta.checkIn}
          checkInNote={typedMeta.checkInNote}
          totalHours={typedMeta.totalHours}
          totalHoursNote={typedMeta.totalHoursNote}
          weekBarElements={weekBarElements}
          onFullReport={() => safeNavigate(navigate, { to: '/my-work/attendance' })}
        />
        <EmployeeLeaveSummary leaveSummary={leaveSummary} />
      </section>

      <EmployeeTasksTable
        tasks={tasks}
        onNewTask={() => safeNavigate(navigate, { to: '/my-work/tasks/new' })}
      />
    </div>
  )
}
