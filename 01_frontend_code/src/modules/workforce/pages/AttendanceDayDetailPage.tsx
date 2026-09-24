import { useParams, useSearch, useNavigate } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { cn } from '@/shared/lib/cn'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { workforceRoutes } from '../routes'
import { useAttendanceDayDetail } from '../hooks/use-attendance'

export function AttendanceDayDetailPage() {
  const navigate = useNavigate()
  const { employmentId } = useParams({ strict: false }) as { employmentId: string }
  const search = useSearch({ strict: false }) as { date?: string }
  const date = search.date ?? new Date().toISOString().slice(0, 10)
  const { data, isLoading, isError, error, refetch } = useAttendanceDayDetail(employmentId, date)

  useDeletedRedirect({ ready: !isLoading, data: data ?? null, error, listTo: workforceRoutes.attendanceRoster })

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !data) {
    return (
      <ErrorState
        description={error instanceof Error ? error.message : 'Failed to load day detail'}
        onRetry={() => refetch()}
        onBack={() => safeNavigate(navigate, { to: workforceRoutes.attendanceRoster })}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={workforceRoutes.attendanceRoster} label="Back to roster" />
      <PageHeader
        title="Attendance day detail"
        description={`Employment #${employmentId} · ${date}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bv-surface card-hover p-5">
          <h3 className="text-title-md font-semibold mb-4">Punches</h3>
          <ul className="space-y-3">
            {data.punches.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-outline-variant p-3"
              >
                <div>
                  <p className="font-medium">{p.punch_type}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {p.punch_time} · IP {p.client_ip}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                    p.is_valid_punch ? 'bg-secondary/15 text-secondary' : 'bg-error/15 text-error',
                  )}
                >
                  {p.is_valid_punch ? 'VALID' : 'INVALID'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bv-surface card-hover p-5">
          <h3 className="text-title-md font-semibold mb-4">Breaks</h3>
          <ul className="space-y-3">
            {data.breaks.map((b) => (
              <li key={b.id} className="rounded-lg border border-outline-variant p-3 text-body-sm">
                {b.start} – {b.end} · {b.duration_min} min
              </li>
            ))}
          </ul>
          <div className="mt-6 p-4 rounded-lg bg-surface-container-low">
            <p className="text-label-sm text-on-surface-variant">Working hours</p>
            <p className="text-title-lg font-semibold">{data.workingHours.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
