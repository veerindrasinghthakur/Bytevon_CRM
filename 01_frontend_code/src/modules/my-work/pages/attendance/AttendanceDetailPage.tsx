import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { queryKeys } from '@/shared/lib/query-keys'
import { listMyAttendance, getMyWorkOverview } from '../../api/my-work'
import { attendanceStatusStyles } from '../../schemas/enums'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { myWorkRoutes } from '../../routes'
import { cn } from '@/shared/lib/cn'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

export function AttendanceDetailPage() {
  const { attendanceId } = useParams({ strict: false }) as { attendanceId: string }
  const navigate = useNavigate()

  const listQuery = useQuery({
    queryKey: queryKeys.myWork.attendance.list({ pageSize: 100 }),
    queryFn: () => listMyAttendance({ pageSize: 100 }),
  })

  const overviewQuery = useQuery({
    queryKey: queryKeys.myWork.overview(),
    queryFn: getMyWorkOverview,
  })

  useDeletedRedirect({
    ready: !listQuery.isLoading,
    data: listQuery.data?.items.find((r) => r.id === attendanceId) ?? null,
    error: listQuery.error,
    listTo: myWorkRoutes.attendance,
  })

  if (listQuery.isLoading) return <PageLoadingSkeleton />

  const record =
    listQuery.data?.items.find((r) => r.id === attendanceId) ?? listQuery.data?.items[0]
  const user = overviewQuery.data?.user

  if (!record) {
    return (
      <div className="animate-fade-in space-y-4">
        <BackButton to={myWorkRoutes.attendance} label="Back to attendance" />
        <PageHeader title="Attendance details" />
        <p className="text-body-md text-on-surface-variant">Record not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <BackButton to={myWorkRoutes.attendance} label="Back to attendance" />
      <PageHeader
        title={`Attendance · ${record.date}`}
        description={user ? `${user.name} · ${user.employeeId}` : undefined}
        actions={
          <Can action={Action.CREATE} resource="attendance" minScope="SELF">
            <Button
              variant="outline"
              leftIcon={<span className="material-symbols-outlined text-lg">edit_calendar</span>}
              onClick={() => safeNavigate(navigate, { to: myWorkRoutes.attendanceCorrections })}
            >
              Request correction
            </Button>
          </Can>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg text-on-background mb-4">Overview</h3>
            <p className="text-body-md text-on-surface-variant">
              {record.note
                ? record.note
                : `Attendance for ${record.date} under ${record.shift ?? 'default'} shift. Status is recorded as ${record.status}.`}
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-label-sm text-on-surface-variant">Check-in</p>
                <p className="text-body-lg font-bold text-secondary mt-1">{record.checkIn ?? '—'}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-label-sm text-on-surface-variant">Check-out</p>
                <p className="text-body-lg font-bold text-on-background mt-1">{record.checkOut ?? '—'}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-label-sm text-on-surface-variant">Total hours</p>
                <p className="text-body-lg font-bold text-on-background mt-1">{record.totalHours ?? '—'}</p>
              </div>
            </div>
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-lg text-on-background mb-3">Timeline</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-body-md">
                <span className="material-symbols-outlined text-secondary text-xl">login</span>
                <div>
                  <p className="font-medium text-on-background">Checked in</p>
                  <p className="text-label-sm text-on-surface-variant">{record.checkIn ?? 'Not recorded'}</p>
                </div>
              </li>
              <li className="flex gap-3 text-body-md">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">logout</span>
                <div>
                  <p className="font-medium text-on-background">Checked out</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {record.checkOut ?? 'Still open / not recorded'}
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <div className="space-y-4">
          <section className="bv-surface p-6">
            <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Status</h3>
            <span
              className={cn(
                'inline-flex px-2.5 py-1 rounded-full text-label-sm font-semibold',
                attendanceStatusStyles[record.status] ?? 'status-badge status-neutral',
              )}
            >
              {record.status}
            </span>
          </section>

          <section className="bv-surface p-6 space-y-4">
            <div>
              <p className="text-label-sm text-on-surface-variant">Date</p>
              <p className="text-body-md text-on-surface mt-0.5">{record.date}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Shift</p>
              <p className="text-body-md text-on-surface mt-0.5">{record.shift ?? '—'}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Employee</p>
              <p className="text-body-md text-on-surface mt-0.5">{user?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Note</p>
              <p className="text-body-md text-on-surface mt-0.5">{record.note ?? '—'}</p>
            </div>
          </section>

          <section className="bv-surface p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => safeNavigate(navigate, { to: myWorkRoutes.attendance })}
            >
              View all attendance
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
